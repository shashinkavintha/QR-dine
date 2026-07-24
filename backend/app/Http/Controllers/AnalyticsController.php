<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\TableQr;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function getDashboardStats(Request $request)
    {
        $tenantId = auth('api')->id();
        $dateFilter = $request->input('date_filter', 'today'); // today, this_week, this_month, all_time

        $owner = \App\Models\User::with('plan')->find($tenantId);
        if ($owner->role !== 'super_admin' && (!$owner->plan || !$owner->plan->has_analytics)) {
            return response()->json(['message' => 'Your current plan does not include Advanced Analytics. Please upgrade to access this feature.'], 403);
        }

        // Build Cache Key
        $cacheKey = "analytics_dashboard_{$tenantId}_{$dateFilter}";

        $query = Order::where('orders.tenant_id', $tenantId)->where('orders.status', '!=', 'cancelled');

        // Apply Date Filter
        $startDate = null;
        $endDate = Carbon::now();

        switch ($dateFilter) {
            case 'today':
                $startDate = Carbon::today();
                break;
            case 'this_week':
                $startDate = Carbon::now()->startOfWeek();
                break;
            case 'this_month':
                $startDate = Carbon::now()->startOfMonth();
                break;
            case 'all_time':
            default:
                $startDate = null;
                break;
        }

        if ($startDate) {
            $query->whereBetween('orders.created_at', [$startDate, $endDate]);
        }

        // 1. Calculate KPIs
        $totalOrders = (clone $query)->count();
        $totalRevenue = (clone $query)->sum('total_amount');
        $averageOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0;
        
        // Active Tables (Tables that had orders in this period)
        $activeTables = clone $query;
        $activeTablesCount = $activeTables->distinct('table_id')->count('table_id');

        // Group orders by hour of the day in local timezone (Asia/Colombo) using PHP to be database agnostic
        $orders = (clone $query)->get(['created_at']);
        $hourlyCounts = [];
        foreach ($orders as $order) {
            $hour = Carbon::parse($order->created_at)->timezone('Asia/Colombo')->format('G'); // 0-23
            $hourlyCounts[$hour] = ($hourlyCounts[$hour] ?? 0) + 1;
        }
        
        $peakHours = [];
        for ($i = 0; $i < 24; $i++) {
            $ampm = $i >= 12 ? 'PM' : 'AM';
            $displayHour = $i % 12 == 0 ? 12 : $i % 12;
            $peakHours[] = [
                'name' => "$displayHour $ampm",
                'orders' => $hourlyCounts[$i] ?? 0
            ];
        }

        // 3. Top Selling Items
        // We need to join OrderItem and MenuItem
        // Since order_items don't have tenant_id directly, we filter orders first
        $orderIds = (clone $query)->pluck('id');
        
        $topItems = OrderItem::whereIn('order_id', $orderIds)
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->selectRaw('menu_items.name, SUM(order_items.quantity) as total_sold')
            ->groupBy('menu_items.id', 'menu_items.name')
            ->orderByDesc('total_sold')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name,
                    'value' => (int) $item->total_sold
                ];
            });

        // 4. Table Performance
        $tablePerformance = (clone $query)
            ->join('table_qrs', 'orders.table_id', '=', 'table_qrs.id')
            ->selectRaw('table_qrs.table_number, COUNT(orders.id) as total_orders, SUM(orders.total_amount) as total_revenue')
            ->groupBy('table_qrs.id', 'table_qrs.table_number')
            ->orderByDesc('total_orders')
            ->take(10)
            ->get()
            ->map(function ($table) {
                return [
                    'table_number' => $table->table_number,
                    'orders' => (int) $table->total_orders,
                    'revenue' => (float) $table->total_revenue
                ];
            });

        $data = [
            'kpis' => [
                'total_orders' => $totalOrders,
                'total_revenue' => $totalRevenue,
                'average_order_value' => $averageOrderValue,
                'active_tables' => $activeTablesCount
            ],
            'peak_hours' => $peakHours,
            'top_items' => $topItems,
            'table_performance' => $tablePerformance
        ];

        return response()->json($data);
    }
}
