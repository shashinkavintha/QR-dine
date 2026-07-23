<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\UpsellRule;
use Illuminate\Http\Request;

class PublicUpsellController extends Controller
{
    public function index(Request $request)
    {
        $rawItemIds = $request->input('item_ids', []);

        if (is_string($rawItemIds)) {
            $itemIds = array_filter(array_map('trim', explode(',', $rawItemIds)));
        } elseif (is_array($rawItemIds)) {
            $itemIds = $rawItemIds;
        } else {
            $itemIds = [];
        }

        if (empty($itemIds)) {
            return response()->json([]);
        }

        $query = UpsellRule::whereIn('item_id', $itemIds);

        if ($request->has('tenant_id') && !empty($request->input('tenant_id'))) {
            $query->where('tenant_id', $request->input('tenant_id'));
        }

        $rules = $query->with('suggestedItem')->get();

        $suggestedItems = $rules->pluck('suggestedItem')
            ->filter(function ($item) use ($itemIds) {
                return $item && !in_array($item->id, $itemIds) && $item->is_available;
            })
            ->unique('id')
            ->values();

        return response()->json($suggestedItems);
    }
}
