<?php

namespace App\Http\Controllers;

use App\Models\WaiterRequest;
use Illuminate\Http\Request;

class TenantWaiterRequestController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = config('tenant.id') ?? $request->user()->tenant_id ?? $request->user()->id;

        $query = WaiterRequest::where('tenant_id', $tenantId);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $requests = $query->orderBy('created_at', 'desc')->get();

        return response()->json($requests);
    }

    public function complete(Request $request, $id)
    {
        $tenantId = config('tenant.id') ?? $request->user()->tenant_id ?? $request->user()->id;

        $waiterRequest = WaiterRequest::where('tenant_id', $tenantId)->findOrFail($id);
        $waiterRequest->update(['status' => 'completed']);

        return response()->json([
            'message' => 'Waiter request marked as completed',
            'data'    => $waiterRequest,
        ]);
    }
}
