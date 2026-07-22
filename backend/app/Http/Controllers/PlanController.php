<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Plan;

class PlanController extends Controller
{
    public function index()
    {
        return response()->json(Plan::all());
    }

    public function update(Request $request, $id)
    {
        $plan = Plan::findOrFail($id);

        $request->validate([
            'price' => 'required|numeric|min:0',
            'duration_months' => 'required|integer|min:1',
            'features' => 'nullable|array',
            'max_menu_items' => 'nullable|integer',
            'max_tables' => 'nullable|integer'
        ]);

        $plan->update($request->only([
            'price', 'duration_months', 'features', 
            'max_menu_items', 'max_tables'
        ]));

        return response()->json(['message' => 'Plan updated successfully', 'plan' => $plan]);
    }
}
