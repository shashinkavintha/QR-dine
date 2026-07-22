<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\TenantSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Handle manual registration
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'restaurant_name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tenant_settings,slug',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Create User with 14-day trial, no plan assigned initially
        $user = User::create([
            'name' => $request->first_name . ' ' . $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'tenant',
            'trial_ends_at' => now()->addDays(14),
            'plan_id' => null,
            'plan_status' => 'trialing',
            'plan_expires_at' => null,
        ]);

        // Create Tenant Settings
        TenantSetting::create([
            'user_id' => $user->id,
            'restaurant_name' => $request->restaurant_name,
            'slug' => strtolower($request->slug),
            'primary_color' => '#f97316',
            'language' => 'en',
        ]);

        // Auto-login and return JWT Token
        // Increment token version so CheckTokenVersion middleware matches
        $user->token_version = ($user->token_version ?? 0) + 1;
        $user->save();

        $token = auth('api')->login($user);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => $user
        ]);
    }

    /**
     * Handle manual login
     */
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json(['error' => 'Incorrect email or password.'], 401);
        }

        $user = auth('api')->user();

        if (!$user->is_active) {
            auth('api')->logout();
            return response()->json(['error' => 'Your account has been deactivated by the administrator.'], 403);
        }

        if ($user->is_suspended) {
            auth('api')->logout();
            return response()->json(['error' => 'Your account is suspended. Please contact support.'], 403);
        }

        // Increment token version to invalidate old tokens
        $user->token_version = $user->token_version + 1;
        $user->save();

        // Regenerate token with new version
        $token = auth('api')->login($user);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => $user
        ]);
    }

    /**
     * Redirect to Google OAuth
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Handle Google OAuth Callback
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            // Check if user already exists
            $user = User::where('email', $googleUser->getEmail())->first();
            
            $isNewUser = false;
            
            if (!$user) {
                // Create new user with 14-day trial, no plan assigned initially
                $isNewUser = true;
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'password' => bcrypt(str()->random(24)),
                    'role' => 'tenant',
                    'trial_ends_at' => now()->addDays(14),
                    'plan_id' => null,
                    'plan_status' => 'trialing',
                    'plan_expires_at' => null,
                    'auth_provider' => 'google',
                    'google_id' => $googleUser->getId(),
                ]);
                
                // Auto-generate a slug based on their name for the tenant settings
                $baseSlug = str()->slug($googleUser->getName());
                $slug = $baseSlug;
                $counter = 1;
                while(TenantSetting::where('slug', $slug)->exists()) {
                    $slug = $baseSlug . '-' . $counter;
                    $counter++;
                }
                
                TenantSetting::create([
                    'user_id' => $user->id,
                    'restaurant_name' => $googleUser->getName() . "'s Restaurant",
                    'slug' => $slug,
                    'primary_color' => '#f97316',
                    'language' => 'en',
                ]);
            } else {
                // If user exists but logged in via Google, just link the google_id.
                // DO NOT overwrite auth_provider so they can still manage their password if they registered via email.
                if (empty($user->google_id)) {
                    $user->google_id = $googleUser->getId();
                    $user->save();
                }
            }

            // Increment token version to invalidate old tokens
            $user->token_version = $user->token_version + 1;
            $user->save();

            // Generate JWT Token
            $token = auth('api')->login($user);
            
            // Redirect back to Next.js Frontend with the token and role
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            $redirectPath = $isNewUser ? '/onboarding' : ($user->role === 'super_admin' ? '/super-admin' : '/dashboard');
            
            return redirect()->away("{$frontendUrl}/auth/google/callback?token={$token}&redirect={$redirectPath}");
            
        } catch (\Exception $e) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            return redirect()->away("{$frontendUrl}/login?error=google_auth_failed");
        }
    }
}
