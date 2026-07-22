<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TenantSetting;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class OnboardingController extends Controller
{
    /**
     * Complete the onboarding process
     */
    public function completeOnboarding(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'restaurant_name' => 'nullable|string|max:255',
            'primary_color' => 'required|string|max:50',
            'category_name' => 'nullable|string|max:255',
            'item_name' => 'nullable|string|max:255',
            'item_price' => 'nullable|numeric|min:0',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = auth()->user();

        // Handle logo upload
        $logoUrl = null;
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', 'public');
            $logoUrl = Storage::url($path);
        }

        // 1. Update Tenant Setting
        $tenantSetting = TenantSetting::firstOrCreate(
            ['user_id' => $user->id],
            [
                'slug' => str()->slug($request->restaurant_name) . '-' . uniqid(),
                'language' => 'en'
            ]
        );

        $tenantSetting->update([
            'primary_color' => $request->primary_color,
            'logo_url' => $logoUrl ?? $tenantSetting->logo_url,
        ]);

        // 2. Create Menu Category (only if provided)
        if ($request->filled('category_name') && $request->filled('item_name')) {
            $category = MenuCategory::create([
                'tenant_id' => $user->id,
                'name' => $request->category_name,
                'sort_order' => 0,
            ]);

            // 3. Create Menu Item
            MenuItem::create([
                'tenant_id' => $user->id,
                'category_id' => $category->id,
                'name' => $request->item_name,
                'price' => $request->item_price ?? 0,
                'is_available' => true,
            ]);
        }

        return response()->json([
            'message' => 'Onboarding completed successfully',
            'tenant_setting' => $tenantSetting
        ]);
    }
}
