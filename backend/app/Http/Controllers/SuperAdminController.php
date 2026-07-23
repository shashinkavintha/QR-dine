<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\TenantSetting;
use App\Models\SystemSetting;
use App\Models\Plan;
use App\Models\Transaction;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SuperAdminController extends Controller
{
    // --- Overview ---
    public function getOverview()
    {
        $tenants = User::where('role', 'tenant')->with('plan')->get();

        $totalActive = 0;
        $mrr = 0;
        $onTrial = 0;

        foreach ($tenants as $user) {
            $isPaidActive = in_array($user->plan_status, ['active', 'upgraded']) && $user->plan_expires_at && \Carbon\Carbon::parse($user->plan_expires_at)->isFuture();
            $isTrialActive = $user->trial_ends_at && \Carbon\Carbon::parse($user->trial_ends_at)->isFuture();
            
            if ($isPaidActive) {
                $totalActive++;
                if ($user->plan) {
                    $mrr += $user->plan->price;
                }
            } elseif ($isTrialActive) {
                $onTrial++;
            }
        }

        $totalUsers = User::count();

        // Recent Signups
        $recentSignups = User::where('role', 'tenant')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->with(['plan', 'tenantSetting'])
            ->get()
            ->map(function ($user) {
                $status = 'EXPIRED';
                if (in_array($user->plan_status, ['active', 'upgraded']) && $user->plan_expires_at && \Carbon\Carbon::parse($user->plan_expires_at)->isFuture()) {
                    $status = 'ACTIVE';
                } elseif ($user->trial_ends_at && \Carbon\Carbon::parse($user->trial_ends_at)->isFuture()) {
                    $status = 'TRIALING';
                }

                return [
                    'id' => $user->id,
                    'name' => $user->tenantSetting ? $user->tenantSetting->restaurant_name : $user->name,
                    'created_at' => $user->created_at->format('M d, h:i A'),
                    'plan' => $user->plan ? $user->plan->name : 'Free Trial',
                    'status' => $status
                ];
            });

        return response()->json([
            'total_active_hotels' => $totalActive,
            'mrr' => $mrr,
            'hotels_on_trial' => $onTrial,
            'total_users' => $totalUsers,
            'recent_signups' => $recentSignups
        ]);
    }

    // --- Tenants ---
    public function getTenants()
    {
        $tenants = User::where('role', 'tenant')->with('plan')->get()->map(function($user) {
            
            // Determine correct status
            if ($user->is_suspended) {
                $status = 'Suspended';
            } elseif (in_array($user->plan_status, ['active', 'upgraded']) && $user->plan_expires_at && \Carbon\Carbon::parse($user->plan_expires_at)->isFuture()) {
                $status = 'Active';
            } elseif ($user->trial_ends_at && \Carbon\Carbon::parse($user->trial_ends_at)->isFuture()) {
                $status = 'Trialing';
            } else {
                $status = 'Expired';
            }

            // Real plan name and price
            $planName = $user->plan ? $user->plan->name : 'Free Trial';
            $planPrice = $user->plan ? $user->plan->price : 0;
            
            // Expiry date: prefer plan_expires_at, fall back to trial_ends_at
            $expiryDate = $user->plan_expires_at ?? $user->trial_ends_at;

            return [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'plan'         => $planName,
                'plan_status'  => $user->plan_status,
                'status'       => $status,
                'is_suspended' => (bool)$user->is_suspended,
                'trialEnds'    => $expiryDate ? \Carbon\Carbon::parse($expiryDate)->format('Y-m-d') : null,
                'users'        => 1,
                'mrr'          => 'Rs. ' . number_format($planPrice, 0),
            ];
        });
        return response()->json($tenants);
    }

    public function addTenant(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'tenant',
            'trial_ends_at' => now()->addDays(14)
        ]);

        TenantSetting::create([
            'user_id' => $user->id,
            'restaurant_name' => $request->name,
            'slug' => Str::slug($request->name) . '-' . strtolower(Str::random(4)),
        ]);

        return response()->json($user);
    }

    public function extendTrial($id, Request $request)
    {
        $user = User::findOrFail($id);
        $days = $request->input('days', 7);
        
        $currentTrial = $user->trial_ends_at && $user->trial_ends_at > now() ? $user->trial_ends_at : now();
        $user->trial_ends_at = $currentTrial->addDays($days);
        $user->save();

        return response()->json(['message' => 'Trial extended']);
    }

    public function editTenant($id, Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email,'.$id,
        ]);

        $user = User::where('role', 'tenant')->findOrFail($id);
        $user->name = $request->name;
        $user->email = $request->email;
        $user->save();

        // Also update the restaurant name in tenant settings
        $tenantSetting = TenantSetting::where('user_id', $user->id)->first();
        if ($tenantSetting) {
            $tenantSetting->restaurant_name = $request->name;
            $tenantSetting->save();
        }

        return response()->json(['message' => 'Tenant updated successfully']);
    }

    public function toggleSuspendTenant($id)
    {
        $user = User::where('role', 'tenant')->findOrFail($id);
        $user->is_suspended = !$user->is_suspended;
        $user->save();

        broadcast(new \App\Events\TenantStatusUpdated($user->id, (bool) $user->is_suspended));

        return response()->json(['message' => 'Tenant suspension status updated', 'is_suspended' => $user->is_suspended]);
    }

    public function deleteTenant($id)
    {
        $user = User::where('role', 'tenant')->findOrFail($id);
        
        // This will cascade if DB is set up that way, otherwise we might need to manually delete relations.
        // For now, let's explicitly delete the tenant settings to be safe.
        TenantSetting::where('user_id', $user->id)->delete();
        
        // We should also delete orders, tables, etc., but to keep it simple we delete the user.
        $user->delete();

        return response()->json(['message' => 'Tenant deleted successfully']);
    }

    // --- Users (Staff) ---
    public function getUsers()
    {
        $users = User::whereIn('role', ['super_admin', 'support', 'developer'])->get()->map(function($user) {
            $roleLabel = 'Super Admin';
            if ($user->role === 'support') $roleLabel = 'Support Staff';
            if ($user->role === 'developer') $roleLabel = 'Developer';

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $roleLabel,
                'lastActive' => 'Just now' // Dummy for now
            ];
        });
        return response()->json($users);
    }

    public function addUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'role' => 'required|in:super_admin,support,developer',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        return response()->json($user);
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }

    // --- Settings ---
    public function getSettings()
    {
        $settings = SystemSetting::pluck('value', 'key');
        return response()->json($settings);
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'hero_mockup_image_phone' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
            'hero_mockup_image_tablet' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
            'hero_mockup_image_laptop' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
            'hero_bg_image' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:102400',
        ]);

        // Handle file uploads explicitly for different mockups
        if ($request->hasFile('hero_mockup_image_phone')) {
            $path = $request->file('hero_mockup_image_phone')->store('settings', 'public');
            $url = Storage::url($path);
            SystemSetting::updateOrCreate(['key' => 'hero_mockup_image_phone_url'], ['value' => $url]);
        }
        if ($request->hasFile('hero_mockup_image_tablet')) {
            $path = $request->file('hero_mockup_image_tablet')->store('settings', 'public');
            $url = Storage::url($path);
            SystemSetting::updateOrCreate(['key' => 'hero_mockup_image_tablet_url'], ['value' => $url]);
        }
        if ($request->hasFile('hero_mockup_image_laptop')) {
            $path = $request->file('hero_mockup_image_laptop')->store('settings', 'public');
            $url = Storage::url($path);
            SystemSetting::updateOrCreate(['key' => 'hero_mockup_image_laptop_url'], ['value' => $url]);
        }
        if ($request->hasFile('hero_bg_image')) {
            $path = $request->file('hero_bg_image')->store('settings', 'public');
            $url = Storage::url($path);
            SystemSetting::updateOrCreate(['key' => 'hero_bg_image'], ['value' => $url]);
        }

        // Process other key-value pairs (ignoring the file inputs)
        \Log::info("Saving settings", $request->all());
        foreach($request->except(['hero_mockup_image_phone', 'hero_mockup_image_tablet', 'hero_mockup_image_laptop', 'hero_bg_image']) as $key => $value) {
            SystemSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
        return response()->json(['message' => 'Settings updated']);
    }

    // --- Billing ---
    public function getPlans()
    {
        $plans = Plan::all();
        if ($plans->isEmpty()) {
            Plan::insert([
                ['name' => 'Basic', 'price' => 15],
                ['name' => 'Pro', 'price' => 29],
                ['name' => 'Enterprise', 'price' => 79],
            ]);
            $plans = Plan::all();
        }
        return response()->json($plans);
    }

    public function updatePlan($id, Request $request)
    {
        $plan = Plan::findOrFail($id);
        $plan->update($request->only([
            'name', 'price', 'duration_months', 'features', 
            'max_menu_items', 'max_languages', 'has_custom_qr', 
            'has_analytics', 'max_tables'
        ]));
        return response()->json($plan);
    }

    public function getTransactions()
    {
        return response()->json(Transaction::with('user')->orderBy('date', 'desc')->get());
    }
}
