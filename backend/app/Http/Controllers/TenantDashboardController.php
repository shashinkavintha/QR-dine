<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\TenantSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TenantDashboardController extends Controller
{
    public function getSettings()
    {
        $tenantId = config('tenant.id');
        $owner = \App\Models\User::find($tenantId)->load('plan');
        
        $settings = TenantSetting::firstOrCreate(
            ['user_id' => $tenantId],
            ['slug' => 'hotel-' . $tenantId]
        );

        $isPaidActive = in_array($owner->plan_status, ['active', 'upgraded']) && $owner->plan_expires_at && \Carbon\Carbon::parse($owner->plan_expires_at)->isFuture();

        if ($owner->is_suspended) {
            $computedStatus = 'suspended';
            $endsAt = null;
            $planName = 'Suspended';
            $planPrice = 0;
        } elseif ($isPaidActive) {
            $computedStatus = 'active';
            $endsAt = $owner->plan_expires_at;
            $planName = $owner->plan ? $owner->plan->name : 'Paid Package';
            $planPrice = $owner->plan ? $owner->plan->price : 0;
        } elseif ($owner->trial_ends_at && \Carbon\Carbon::parse($owner->trial_ends_at)->isFuture()) {
            $computedStatus = 'trialing';
            $endsAt = $owner->trial_ends_at;
            $planName = 'Free Trial';
            $planPrice = 0;
        } else {
            $computedStatus = 'expired';
            $endsAt = $owner->plan_expires_at ?? $owner->trial_ends_at;
            $planName = 'Expired';
            $planPrice = 0;
        }

        $daysLeft = $endsAt ? \Carbon\Carbon::now()->diffInDays(\Carbon\Carbon::parse($endsAt), false) : 0;
        $daysLeft = (int) ceil($daysLeft);

        $currentUser = auth()->user();
        $permissions = [];
        if ($currentUser->role === 'staff') {
            $currentUser->load('roles.permissions');
            $permissions = $currentUser->roles->flatMap->permissions->pluck('name')->toArray();
        }

        return response()->json([
            'settings' => $settings,
            'user' => [
                'name'       => $currentUser->name,
                'email'      => $currentUser->email,
                'plan_name'  => $planName,
                'plan_price' => $planPrice,
                'status'     => $computedStatus,
                'ends_at'    => $endsAt,
                'days_left'  => $daysLeft > 0 ? $daysLeft : 0,
                'is_expired' => $computedStatus === 'expired',
                'role'       => $currentUser->role,
                'permissions'=> $permissions,
            ]
        ]);
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
            'banner' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
        ]);

        $settings = TenantSetting::where('user_id', config('tenant.id'))->first();
        
        $data = $request->only(['restaurant_name', 'primary_color', 'secondary_color', 'font_family', 'slug', 'currency', 'theme_mode']);
        
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', config('filesystems.default'));
            $data['logo_url'] = Storage::url($path);
        }

        if ($request->hasFile('banner')) {
            $path = $request->file('banner')->store('banners', config('filesystems.default'));
            $data['banner_url'] = Storage::url($path);
        }

        $settings->update($data);
        return response()->json($settings);
    }

    public function getMenu()
    {
        $categories = MenuCategory::with('items.modifiers')->get();
        return response()->json($categories);
    }

    public function addCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
        ]);

        $data = [
            'tenant_id' => config('tenant.id'),
            'name' => $request->name,
            'sort_order' => $request->sort_order ?? 0
        ];
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('menu_categories', config('filesystems.default'));
            $data['image_url'] = Storage::url($path);
        }
        $category = MenuCategory::create($data);
        \Illuminate\Support\Facades\Cache::forget("tenant:" . config('tenant.id') . ":menu");
        return response()->json($category->load('items'));
    }

    public function updateCategory(Request $request, $id)
    {
        $request->validate([
            'image' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
        ]);

        $category = MenuCategory::where('tenant_id', config('tenant.id'))->findOrFail($id);
        $data = $request->only(['name', 'sort_order']);
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('menu_categories', config('filesystems.default'));
            $data['image_url'] = Storage::url($path);
        }
        $category->update($data);
        \Illuminate\Support\Facades\Cache::forget("tenant:" . config('tenant.id') . ":menu");
        return response()->json($category->load('items'));
    }

    public function deleteCategory($id)
    {
        $category = MenuCategory::where('tenant_id', config('tenant.id'))->findOrFail($id);
        $category->delete();
        \Illuminate\Support\Facades\Cache::forget("tenant:" . config('tenant.id') . ":menu");
        return response()->json(['success' => true]);
    }

    public function addMenuItem(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
        ]);

        $portions = null;
        if ($request->has('portions')) {
            $portions = is_string($request->portions) ? json_decode($request->portions, true) : $request->portions;
        }

        $modifiers = null;
        if ($request->has('modifiers')) {
            $modifiers = is_string($request->modifiers) ? json_decode($request->modifiers, true) : $request->modifiers;
        }

        $tenantId = config('tenant.id');

        // Enforce max_menu_items limit
        $owner = \App\Models\User::with('plan')->find($tenantId);
        $isPaidActive = in_array($owner->plan_status, ['active', 'upgraded']) && $owner->plan_expires_at && \Carbon\Carbon::parse($owner->plan_expires_at)->isFuture();

        if ($isPaidActive && $owner->plan && $owner->plan->max_menu_items !== null) {
            $currentItemsCount = MenuItem::where('tenant_id', $tenantId)->count();
            if ($currentItemsCount >= $owner->plan->max_menu_items) {
                return response()->json(['error' => 'You have reached the maximum number of menu items allowed on your current plan. Please upgrade to add more.'], 403);
            }
        }

        $data = [
            'tenant_id' => $tenantId,
            'category_id' => $request->category_id,
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price ?? 0,
            'is_available' => filter_var($request->is_available, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
            'portions' => $portions,
        ];
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('menu_items', config('filesystems.default'));
            $data['image_url'] = Storage::url($path);
        }
        $item = MenuItem::create($data);

        if ($modifiers && is_array($modifiers)) {
            foreach ($modifiers as $modifierGroup) {
                \App\Models\ItemModifier::create([
                    'tenant_id' => config('tenant.id'),
                    'menu_item_id' => $item->id,
                    'name' => $modifierGroup['name'] ?? 'Extras',
                    'is_multiple_choice' => true,
                    'is_required' => false,
                    'options' => $modifierGroup['options'] ?? [],
                ]);
            }
        }

        \Illuminate\Support\Facades\Cache::forget("tenant:" . config('tenant.id') . ":menu");
        return response()->json($item);
    }

    public function updateMenuItem(Request $request, $id)
    {
        $request->validate([
            'image' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:2048',
        ]);

        $item = MenuItem::where('tenant_id', config('tenant.id'))->findOrFail($id);
        $data = $request->only(['name', 'description', 'price', 'category_id']);
        if ($request->has('is_available')) {
            $data['is_available'] = filter_var($request->is_available, FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->has('portions')) {
            $data['portions'] = is_string($request->portions) ? json_decode($request->portions, true) : $request->portions;
        }

        $modifiers = null;
        if ($request->has('modifiers')) {
            $modifiers = is_string($request->modifiers) ? json_decode($request->modifiers, true) : $request->modifiers;
        }
        if (!isset($data['price']) && isset($data['portions'])) {
            $data['price'] = 0; // fallback if portions provided without price
        }
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('menu_items', config('filesystems.default'));
            $data['image_url'] = Storage::url($path);
        }
        $item->update($data);

        if (isset($modifiers)) {
            // Delete old modifiers and create new ones (simplest sync logic)
            \App\Models\ItemModifier::where('menu_item_id', $item->id)->delete();
            
            if (is_array($modifiers)) {
                foreach ($modifiers as $modifierGroup) {
                    \App\Models\ItemModifier::create([
                        'tenant_id' => config('tenant.id'),
                        'menu_item_id' => $item->id,
                        'name' => $modifierGroup['name'] ?? 'Extras',
                        'is_multiple_choice' => true,
                        'is_required' => false,
                        'options' => $modifierGroup['options'] ?? [],
                    ]);
                }
            }
        }

        \Illuminate\Support\Facades\Cache::forget("tenant:" . config('tenant.id') . ":menu");
        return response()->json($item);
    }

    public function deleteMenuItem($id)
    {
        $item = MenuItem::where('tenant_id', config('tenant.id'))->findOrFail($id);
        $item->delete();
        \Illuminate\Support\Facades\Cache::forget("tenant:" . config('tenant.id') . ":menu");
        return response()->json(['success' => true]);
    }

    public function getTrashedMenuItems()
    {
        $items = MenuItem::onlyTrashed()->where('tenant_id', config('tenant.id'))->get();
        return response()->json($items);
    }

    public function restoreMenuItem($id)
    {
        $item = MenuItem::onlyTrashed()->where('tenant_id', config('tenant.id'))->findOrFail($id);
        $item->restore();
        \Illuminate\Support\Facades\Cache::forget("tenant:" . config('tenant.id') . ":menu");
        return response()->json(['success' => true]);
    }

    public function forceDeleteMenuItem($id)
    {
        $item = MenuItem::onlyTrashed()->where('tenant_id', config('tenant.id'))->findOrFail($id);
        $item->forceDelete();
        \Illuminate\Support\Facades\Cache::forget("tenant:" . config('tenant.id') . ":menu");
        return response()->json(['success' => true]);
    }

    public function getTrashedMenuCategories()
    {
        $categories = MenuCategory::onlyTrashed()->where('tenant_id', config('tenant.id'))->get();
        return response()->json($categories);
    }

    public function restoreMenuCategory($id)
    {
        $category = MenuCategory::onlyTrashed()->where('tenant_id', config('tenant.id'))->findOrFail($id);
        $category->restore();
        \Illuminate\Support\Facades\Cache::forget("tenant:" . config('tenant.id') . ":menu");
        return response()->json(['success' => true]);
    }

    public function forceDeleteMenuCategory($id)
    {
        $category = MenuCategory::onlyTrashed()->where('tenant_id', config('tenant.id'))->findOrFail($id);
        $category->forceDelete();
        \Illuminate\Support\Facades\Cache::forget("tenant:" . config('tenant.id') . ":menu");
        return response()->json(['success' => true]);
    }
}
