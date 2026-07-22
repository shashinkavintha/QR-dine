<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\TableQr;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicOrderTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;
    protected $table;
    protected $menuItem;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenant = User::factory()->create([
            'role' => 'tenant',
            'is_active' => true,
            'is_suspended' => false,
            'plan_status' => 'active',
            'plan_expires_at' => now()->addDays(30),
        ]);

        $this->table = TableQr::create([
            'tenant_id' => $this->tenant->id,
            'table_number' => '10',
            'redirect_hash' => 'hash123'
        ]);

        $category = MenuCategory::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Pizza',
        ]);

        $this->menuItem = MenuItem::create([
            'tenant_id' => $this->tenant->id,
            'category_id' => $category->id,
            'name' => 'Cheese Pizza',
            'price' => 12,
        ]);
    }

    public function test_customer_can_place_order()
    {
        $payload = [
            'tenant_id' => $this->tenant->id,
            'table_id' => $this->table->id,
            'items' => [
                [
                    'menu_item_id' => $this->menuItem->id,
                    'quantity' => 2,
                ]
            ]
        ];

        $response = $this->postJson('/api/public/orders', $payload);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'order' => [
                         'id',
                         'tenant_id',
                         'table_id',
                         'total_amount',
                         'status'
                     ]
                 ]);

        // 2 items * 12 = 24
        $this->assertDatabaseHas('orders', [
            'tenant_id' => $this->tenant->id,
            'table_id' => $this->table->id,
            'total_amount' => 24,
            'status' => 'pending'
        ]);

        $this->assertDatabaseHas('order_items', [
            'menu_item_id' => $this->menuItem->id,
            'quantity' => 2,
            'unit_price' => 12
        ]);
    }

    public function test_customer_cannot_order_if_tenant_suspended()
    {
        $this->tenant->is_suspended = true;
        $this->tenant->save();

        $payload = [
            'tenant_id' => $this->tenant->id,
            'items' => [
                [
                    'menu_item_id' => $this->menuItem->id,
                    'quantity' => 1,
                ]
            ]
        ];

        $response = $this->postJson('/api/public/orders', $payload);

        $response->assertStatus(403)
                 ->assertJson(['error' => 'This menu is currently unavailable.']);
    }

    public function test_customer_cannot_order_if_subscription_expired()
    {
        $this->tenant->update([
            'plan_expires_at' => now()->subDays(1),
            'trial_ends_at' => null
        ]);

        $payload = [
            'tenant_id' => $this->tenant->id,
            'items' => [
                [
                    'menu_item_id' => $this->menuItem->id,
                    'quantity' => 1,
                ]
            ]
        ];

        $response = $this->postJson('/api/public/orders', $payload);

        $response->assertStatus(403)
                 ->assertJson(['error' => 'This menu subscription has expired.']);
    }
}
