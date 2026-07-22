<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index()
    {
        $tenantId = config('tenant.id') ?? auth()->id();
        // Get all orders for the tenant, include table details and items
        $orders = Order::with(['tableQr', 'items.menuItem'])
            ->where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($orders);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,preparing,completed,cancelled',
        ]);

        $tenantId = config('tenant.id') ?? auth()->id();
        $order = Order::where('tenant_id', $tenantId)->findOrFail($id);
        
        $order->status = $request->status;
        $order->save();

        event(new \App\Events\OrderStatusUpdated($order));

        return response()->json($order);
    }

    public function printOrder($id)
    {
        $tenantId = config('tenant.id') ?? auth()->id();
        $order = Order::where('tenant_id', $tenantId)->findOrFail($id);
        
        $order->is_printed = true;
        $order->save();

        return response()->json(['message' => 'Order marked as printed', 'order' => $order]);
    }
}
