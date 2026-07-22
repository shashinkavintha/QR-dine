<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantOrderTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create([
            'role' => 'tenant',
            'is_active' => true,
            'is_suspended' => false,
            'plan_status' => 'active',
            'plan_expires_at' => now()->addDays(30),
        ]);
        
        $token = auth('api')->login($this->user);
        $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ]);
    }

    public function test_tenant_can_list_orders()
    {
        $order = Order::create([
            'tenant_id' => $this->user->id,
            'total_amount' => 50,
            'status' => 'pending'
        ]);

        $response = $this->getJson('/api/tenant/orders');

        $response->assertStatus(200)
                 ->assertJsonFragment(['total_amount' => 50])
                 ->assertJsonFragment(['status' => 'pending']);
    }

    public function test_tenant_can_update_order_status()
    {
        $order = Order::create([
            'tenant_id' => $this->user->id,
            'total_amount' => 50,
            'status' => 'pending'
        ]);

        $response = $this->putJson("/api/tenant/orders/{$order->id}/status", [
            'status' => 'preparing'
        ]);

        $response->assertStatus(200)
                 ->assertJsonFragment(['status' => 'preparing']);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'preparing'
        ]);
    }

    public function test_tenant_can_print_order()
    {
        $order = Order::create([
            'tenant_id' => $this->user->id,
            'total_amount' => 50,
            'status' => 'pending',
            'is_printed' => false
        ]);

        $response = $this->postJson("/api/tenant/orders/{$order->id}/print");

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Order marked as printed']);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'is_printed' => true
        ]);
    }
}
