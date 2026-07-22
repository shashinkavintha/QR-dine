<?php

namespace App\Http\Controllers;

use App\Models\MenuCategory;
use App\Models\TenantSetting;
use Illuminate\Http\Request;

class PublicMenuController extends Controller
{
    /**
     * Fetch the public menu data for a specific hotel by its URL slug.
     */
    public function getMenuBySlug($slug)
    {
        // 1. Find the tenant by slug
        $settings = TenantSetting::with('user')->where('slug', $slug)->first();

        if (!$settings) {
            return response()->json(['error' => 'Menu not found'], 404);
        }

        if ($settings->user && $settings->user->is_suspended) {
            return response()->json(['error' => 'This menu is currently unavailable.'], 403);
        }

        if ($settings->user) {
            $expiry = \Carbon\Carbon::parse($settings->user->plan_expires_at ?? $settings->user->trial_ends_at);
            if ($expiry->isPast()) {
                return response()->json(['error' => 'This menu is currently unavailable due to an expired subscription.'], 403);
            }
        }

        $tenantId = $settings->user_id;

        $cacheKey = "tenant:{$tenantId}:menu";

        $categories = MenuCategory::withoutGlobalScope(\App\Scopes\TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->with(['items' => function ($query) use ($tenantId) {
                $query->withoutGlobalScope(\App\Scopes\TenantScope::class)
                      ->where('tenant_id', $tenantId)
                      ->where('is_available', true)
                      ->with(['modifiers' => function ($modQuery) use ($tenantId) {
                          $modQuery->withoutGlobalScope(\App\Scopes\TenantScope::class)
                                   ->where('tenant_id', $tenantId);
                      }]);
            }])
            ->orderBy('sort_order')
            ->get()
            ->toArray();

        return response()->json([
            'branding' => $settings,
            'menu' => $categories
        ]);
    }
}
