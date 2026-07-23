<?php

namespace Tests\Feature;

use App\Events\WaiterRequestCreated;
use App\Models\TableQr;
use App\Models\User;
use App\Models\WaiterRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class WaiterRequestTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;
    protected $table;
    protected $token;

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
            'table_number' => '5',
            'redirect_hash' => 'tablehash5',
        ]);

        $this->token = auth('api')->login($this->tenant);
    }

    public function test_customer_can_create_waiter_request()
    {
        Event::fake([WaiterRequestCreated::class]);

        $payload = [
            'tenant_id' => $this->tenant->id,
            'table_id' => $this->table->id,
            'request_type' => 'water',
        ];

        $response = $this->postJson('/api/public/waiter-requests', $payload);

        $response->assertStatus(201)
                 ->assertJsonFragment([
                     'message' => 'Waiter request created successfully',
                 ]);

        $this->assertDatabaseHas('waiter_requests', [
            'tenant_id' => $this->tenant->id,
            'table_id' => $this->table->id,
            'table_number' => '5',
            'request_type' => 'water',
            'status' => 'pending',
        ]);

        Event::assertDispatched(WaiterRequestCreated::class);
    }

    public function test_tenant_can_list_waiter_requests()
    {
        WaiterRequest::create([
            'tenant_id' => $this->tenant->id,
            'table_id' => $this->table->id,
            'table_number' => '5',
            'request_type' => 'bill',
            'status' => 'pending',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/tenant/waiter-requests');

        $response->assertStatus(200)
                 ->assertJsonFragment(['request_type' => 'bill', 'status' => 'pending']);
    }

    public function test_tenant_can_complete_waiter_request()
    {
        $request = WaiterRequest::create([
            'tenant_id' => $this->tenant->id,
            'table_id' => $this->table->id,
            'table_number' => '5',
            'request_type' => 'waiter',
            'status' => 'pending',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->putJson("/api/tenant/waiter-requests/{$request->id}/complete");

        $response->assertStatus(200)
                 ->assertJsonFragment(['status' => 'completed']);

        $request2 = WaiterRequest::create([
            'tenant_id' => $this->tenant->id,
            'table_id' => $this->table->id,
            'table_number' => '5',
            'request_type' => 'water',
            'status' => 'pending',
        ]);

        $resolveResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson("/api/tenant/waiter-requests/{$request2->id}/resolve");

        $resolveResponse->assertStatus(200)
                        ->assertJsonFragment(['status' => 'completed']);

        $this->assertDatabaseHas('waiter_requests', [
            'id' => $request->id,
            'status' => 'completed',
        ]);
    }
}
