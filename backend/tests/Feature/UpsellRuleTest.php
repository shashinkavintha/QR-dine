<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\UpsellRule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpsellRuleTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;
    protected $itemA;
    protected $itemB;
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

        $category = MenuCategory::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Mains',
        ]);

        $this->itemA = MenuItem::create([
            'tenant_id' => $this->tenant->id,
            'category_id' => $category->id,
            'name' => 'Burger',
            'price' => 10,
            'is_available' => true,
        ]);

        $this->itemB = MenuItem::create([
            'tenant_id' => $this->tenant->id,
            'category_id' => $category->id,
            'name' => 'French Fries',
            'price' => 4,
            'is_available' => true,
        ]);

        $this->token = auth('api')->login($this->tenant);
    }

    public function test_tenant_can_create_and_list_upsell_rules()
    {
        $payload = [
            'item_id'           => $this->itemA->id,
            'suggested_item_id' => $this->itemB->id,
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/tenant/upsell-rules', $payload);

        $response->assertStatus(201)
                 ->assertJsonFragment([
                     'message' => 'Upsell rule created successfully',
                 ]);

        $this->assertDatabaseHas('upsell_rules', [
            'tenant_id'         => $this->tenant->id,
            'item_id'           => $this->itemA->id,
            'suggested_item_id' => $this->itemB->id,
        ]);

        $listResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/tenant/upsell-rules');

        $listResponse->assertStatus(200)
                     ->assertJsonFragment(['name' => 'Burger'])
                     ->assertJsonFragment(['name' => 'French Fries']);
    }

    public function test_tenant_can_delete_upsell_rule()
    {
        $rule = UpsellRule::create([
            'tenant_id'         => $this->tenant->id,
            'item_id'           => $this->itemA->id,
            'suggested_item_id' => $this->itemB->id,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson("/api/tenant/upsell-rules/{$rule->id}");

        $response->assertStatus(200)
                 ->assertJsonFragment(['message' => 'Upsell rule deleted successfully']);

        $this->assertDatabaseMissing('upsell_rules', [
            'id' => $rule->id,
        ]);
    }

    public function test_public_upsell_returns_suggested_items_for_cart()
    {
        UpsellRule::create([
            'tenant_id'         => $this->tenant->id,
            'item_id'           => $this->itemA->id,
            'suggested_item_id' => $this->itemB->id,
        ]);

        $response = $this->getJson("/api/public/upsell?item_ids={$this->itemA->id}");

        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'name' => 'French Fries',
                 ]);
    }
}
