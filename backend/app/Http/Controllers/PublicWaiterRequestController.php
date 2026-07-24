<?php

namespace App\Http\Controllers;

use App\Events\WaiterRequestCreated;
use App\Models\TableQr;
use App\Models\WaiterRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PublicWaiterRequestController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tenant_id'    => 'required|uuid|exists:users,id',
            'table_id'     => [
                'nullable',
                'uuid',
                Rule::exists('table_qrs', 'id')->where('tenant_id', $request->input('tenant_id')),
            ],
            'table_number' => 'nullable|string|max:50',
            'request_type' => 'required|string|in:waiter,water,bill',
            'note'         => 'nullable|string|max:500',
        ]);

        if (empty($validated['table_number']) && !empty($validated['table_id'])) {
            $table = TableQr::find($validated['table_id']);
            if ($table) {
                $validated['table_number'] = $table->table_number;
            }
        }

        $validated['status'] = 'pending';

        $waiterRequest = WaiterRequest::create($validated);

        try {
            event(new WaiterRequestCreated($waiterRequest));
        } catch (\Exception $e) {
            \Log::error('Failed to broadcast waiter request: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Waiter request created successfully',
            'data'    => $waiterRequest,
        ], 201);
    }
}
