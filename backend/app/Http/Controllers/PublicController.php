<?php

namespace App\Http\Controllers;

use App\Models\TableQr;
use App\Models\TenantSetting;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Models\SystemSetting;

class PublicController extends Controller
{
    public function getSettings()
    {
        $settings = SystemSetting::pluck('value', 'key');
        // We only want to return public settings
        return response()->json([
            'hero_mockup_image_phone_url' => $settings->get('hero_mockup_image_phone_url'),
            'hero_mockup_image_tablet_url' => $settings->get('hero_mockup_image_tablet_url'),
            'hero_mockup_image_laptop_url' => $settings->get('hero_mockup_image_laptop_url'),
            'landing_page_testimonials' => $settings->get('landing_page_testimonials'),
        ]);
    }

    public function resolveQr($hash)
    {
        $tableQr = TableQr::with('tenant')->where('redirect_hash', $hash)->first();

        if (!$tableQr) {
            return response()->json(['error' => 'Invalid QR Code'], 404);
        }

        $tenant = $tableQr->tenant;
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        
        if ($tenant->is_suspended) {
            return redirect()->away("{$frontendUrl}/suspended");
        }

        $settings = TenantSetting::where('user_id', $tenant->id)->first();
        $slug = $settings ? $settings->slug : $tenant->id;

        // Redirect to the frontend menu with the table_id in the URL
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        
        return redirect()->away("{$frontendUrl}/menu/{$slug}?table={$tableQr->id}");
    }

    public function placeOrder(Request $request)
    {
        $request->validate([
            'tenant_id' => 'required|exists:users,id',
            'table_id' => 'nullable|exists:table_qrs,id',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.portion' => 'nullable|string',
            'items.*.modifiers' => 'nullable|array',
        ]);

        try {
            $tenant = \App\Models\User::findOrFail($request->tenant_id);
            if ($tenant->is_suspended || !$tenant->is_active) {
                return response()->json(['error' => 'This menu is currently unavailable.'], 403);
            }
            $expiry = \Carbon\Carbon::parse($tenant->plan_expires_at ?? $tenant->trial_ends_at);
            if ($expiry->isPast()) {
                return response()->json(['error' => 'This menu subscription has expired.'], 403);
            }

            DB::beginTransaction();

            $tenantId = $request->tenant_id;
            
            // Get currency from tenant settings
            $settings = TenantSetting::where('user_id', $tenantId)->first();
            $currency = $settings ? $settings->currency : 'USD';

            // Pre-fetch all requested menu items with their modifiers
            $itemIds = collect($request->items)->pluck('menu_item_id')->unique();
            $menuItems = \App\Models\MenuItem::whereIn('id', $itemIds)->with('modifiers')->get()->keyBy('id');

            $processedItems = [];
            $totalAmount = 0;

            foreach ($request->items as $itemData) {
                $menuItem = $menuItems->get($itemData['menu_item_id']);
                if (!$menuItem || $menuItem->tenant_id != $tenantId) {
                    DB::rollBack();
                    return response()->json(['error' => 'One or more items in your cart are no longer available. Please refresh the menu and try again.'], 400);
                }

                $basePrice = $menuItem->price;
                if (isset($itemData['portion']) && is_array($menuItem->portions)) {
                    $portionConfig = collect($menuItem->portions)->firstWhere('name', $itemData['portion']);
                    if ($portionConfig) {
                        $basePrice = $portionConfig['price'];
                    }
                }

                $modifiersTotal = 0;
                $selectedModifiers = [];

                if (isset($itemData['modifiers']) && is_array($itemData['modifiers'])) {
                    foreach ($itemData['modifiers'] as $requestedMod) {
                        $foundOption = null;
                        foreach ($menuItem->modifiers as $dbGroup) {
                            if (is_array($dbGroup->options)) {
                                $opt = collect($dbGroup->options)->firstWhere('name', $requestedMod['name']);
                                if ($opt) {
                                    $foundOption = $opt;
                                    break;
                                }
                            }
                        }
                        if ($foundOption) {
                            $modifiersTotal += floatval($foundOption['price']);
                            $selectedModifiers[] = [
                                'name' => $foundOption['name'],
                                'price' => floatval($foundOption['price'])
                            ];
                        }
                    }
                }

                $calculatedUnitPrice = floatval($basePrice) + $modifiersTotal;
                $lineTotal = $calculatedUnitPrice * intval($itemData['quantity']);
                $totalAmount += $lineTotal;

                $processedItems[] = [
                    'menu_item_id' => $menuItem->id,
                    'quantity' => intval($itemData['quantity']),
                    'unit_price' => $calculatedUnitPrice,
                    'portion' => $itemData['portion'] ?? null,
                    'selected_modifiers' => empty($selectedModifiers) ? null : $selectedModifiers,
                ];
            }

            $order = Order::create([
                'tenant_id' => $tenantId,
                'table_id' => $request->table_id ?? null,
                'status' => 'pending',
                'total_amount' => $totalAmount,
                'currency' => $currency,
            ]);

            foreach ($processedItems as $pItem) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $pItem['menu_item_id'],
                    'quantity' => $pItem['quantity'],
                    'unit_price' => $pItem['unit_price'],
                    'portion' => $pItem['portion'],
                    'selected_modifiers' => $pItem['selected_modifiers'],
                ]);
            }

            // Fetch the fully loaded order
            $order = Order::with('items')->find($order->id);
            
            try {
                event(new \App\Events\OrderCreated($order));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to broadcast order creation: ' . $e->getMessage());
            }

            DB::commit();

            return response()->json([
                'message' => 'Order placed successfully',
                'order' => $order
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Order placement failed: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Failed to place order: ' . $e->getMessage()], 500);
        }
    }

    public function getOrderStatus($id)
    {
        $order = Order::with(['items.menuItem', 'tableQr'])->find($id);

        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        return response()->json([
            'order' => $order
        ]);
    }
}
