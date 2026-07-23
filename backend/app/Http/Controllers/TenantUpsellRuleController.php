<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\UpsellRule;
use Illuminate\Http\Request;

class TenantUpsellRuleController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = config('tenant.id') ?? $request->user()->tenant_id ?? $request->user()->id;

        $rules = UpsellRule::where('tenant_id', $tenantId)
            ->with(['item', 'suggestedItem'])
            ->get();

        return response()->json($rules);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id'           => 'required|uuid|exists:menu_items,id',
            'suggested_item_id' => 'required|uuid|exists:menu_items,id|different:item_id',
        ]);

        $tenantId = config('tenant.id') ?? $request->user()->tenant_id ?? $request->user()->id;

        // Ensure both items belong to this tenant
        $itemsCount = MenuItem::where('tenant_id', $tenantId)
            ->whereIn('id', [$validated['item_id'], $validated['suggested_item_id']])
            ->count();

        if ($itemsCount < 2) {
            return response()->json([
                'message' => 'Both items must belong to your tenant menu.',
            ], 422);
        }

        $rule = UpsellRule::firstOrCreate([
            'tenant_id'         => $tenantId,
            'item_id'           => $validated['item_id'],
            'suggested_item_id' => $validated['suggested_item_id'],
        ]);

        $rule->load(['item', 'suggestedItem']);

        return response()->json([
            'message' => 'Upsell rule created successfully',
            'data'    => $rule,
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = config('tenant.id') ?? $request->user()->tenant_id ?? $request->user()->id;

        $rule = UpsellRule::where('tenant_id', $tenantId)->findOrFail($id);
        $rule->delete();

        return response()->json([
            'message' => 'Upsell rule deleted successfully',
        ]);
    }
}
