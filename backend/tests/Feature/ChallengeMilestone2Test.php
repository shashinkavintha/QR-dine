<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Review;
use App\Models\TableQr;
use App\Models\TenantSetting;
use App\Models\UpsellRule;
use App\Models\User;
use App\Models\WaiterRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChallengeMilestone2Test extends TestCase
{
    use RefreshDatabase;

    protected $tenantA;
    protected $tenantB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantA = User::factory()->create([
            'role' => 'tenant',
            'is_active' => true,
            'is_suspended' => false,
            'plan_status' => 'active',
            'plan_expires_at' => now()->addDays(30),
        ]);

        $this->tenantB = User::factory()->create([
            'role' => 'tenant',
            'is_active' => true,
            'is_suspended' => false,
            'plan_status' => 'active',
            'plan_expires_at' => now()->addDays(30),
        ]);
    }

    protected function authHeaders($user)
    {
        $token = auth('api')->login($user);
        return [
            'Authorization' => 'Bearer ' . $token,
        ];
    }

    /* =========================================================================
     * 1. WAITER REQUEST API TESTS
     * ========================================================================= */

    public function test_waiter_request_invalid_request_type_fails_validation()
    {
        $payload = [
            'tenant_id'    => $this->tenantA->id,
            'request_type' => 'invalid',
        ];

        $response = $this->postJson('/api/public/waiter-requests', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['request_type']);
    }

    public function test_waiter_request_valid_request_types()
    {
        foreach (['waiter', 'water', 'bill'] as $type) {
            $payload = [
                'tenant_id'    => $this->tenantA->id,
                'request_type' => $type,
            ];

            $response = $this->postJson('/api/public/waiter-requests', $payload);
            $response->assertStatus(201);
        }
    }

    public function test_waiter_request_non_existent_tenant_fails_validation()
    {
        $payload = [
            'tenant_id'    => '00000000-0000-0000-0000-000000000000',
            'request_type' => 'water',
        ];

        $response = $this->postJson('/api/public/waiter-requests', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['tenant_id']);
    }

    public function test_waiter_request_non_existent_table_fails_validation()
    {
        $payload = [
            'tenant_id'    => $this->tenantA->id,
            'table_id'     => '00000000-0000-0000-0000-000000000000',
            'request_type' => 'water',
        ];

        $response = $this->postJson('/api/public/waiter-requests', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['table_id']);
    }

    public function test_waiter_request_table_belonging_to_another_tenant()
    {
        $tableB = TableQr::create([
            'tenant_id'    => $this->tenantB->id,
            'table_number' => 'B-101',
            'redirect_hash' => 'tablehashB101',
        ]);

        // Tenant A ID, but Tenant B Table ID
        $payload = [
            'tenant_id'    => $this->tenantA->id,
            'table_id'     => $tableB->id,
            'request_type' => 'water',
        ];

        $response = $this->postJson('/api/public/waiter-requests', $payload);

        // A table belonging to Tenant B should NOT be accepted in a request for Tenant A
        $this->assertEquals(422, $response->status(), 'Waiter request should reject table_id belonging to another tenant');
    }

    /* =========================================================================
     * 2. SMART REVIEWS TESTS
     * ========================================================================= */

    public function test_smart_reviews_rating_lower_than_min_fails_validation()
    {
        $payload = [
            'tenant_id' => $this->tenantA->id,
            'rating'    => 0,
        ];

        $response = $this->postJson('/api/public/reviews', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['rating']);
    }

    public function test_smart_reviews_rating_greater_than_max_fails_validation()
    {
        $payload = [
            'tenant_id' => $this->tenantA->id,
            'rating'    => 6,
        ];

        $response = $this->postJson('/api/public/reviews', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['rating']);
    }

    public function test_smart_reviews_4_5_star_redirect_when_google_url_set()
    {
        TenantSetting::create([
            'user_id'           => $this->tenantA->id,
            'slug'              => 'hotel-' . $this->tenantA->id,
            'google_review_url' => 'https://g.page/r/example/review',
        ]);

        foreach ([4, 5] as $rating) {
            $response = $this->postJson('/api/public/reviews', [
                'tenant_id' => $this->tenantA->id,
                'rating'    => $rating,
                'comment'   => "Rating {$rating} review",
            ]);

            $response->assertStatus(201)
                     ->assertJson([
                         'redirect_url' => 'https://g.page/r/example/review',
                     ]);
        }
    }

    public function test_smart_reviews_4_5_star_redirect_when_google_url_unset()
    {
        $response = $this->postJson('/api/public/reviews', [
            'tenant_id' => $this->tenantA->id,
            'rating'    => 5,
            'comment'   => 'Great experience!',
        ]);

        $response->assertStatus(201);
        $this->assertArrayNotHasKey('redirect_url', $response->json());
    }

    public function test_smart_reviews_1_3_star_complaint_saving()
    {
        foreach ([1, 2, 3] as $rating) {
            $response = $this->postJson('/api/public/reviews', [
                'tenant_id'     => $this->tenantA->id,
                'rating'        => $rating,
                'comment'       => "Complaint with rating {$rating}",
                'customer_name' => 'Angry Customer',
            ]);

            $response->assertStatus(201);

            $this->assertDatabaseHas('reviews', [
                'tenant_id'     => $this->tenantA->id,
                'rating'        => $rating,
                'comment'       => "Complaint with rating {$rating}",
                'customer_name' => 'Angry Customer',
                'status'        => 'unread',
            ]);
        }
    }

    public function test_smart_reviews_1_3_star_should_not_redirect_to_google()
    {
        TenantSetting::create([
            'user_id'           => $this->tenantA->id,
            'slug'              => 'hotel-' . $this->tenantA->id,
            'google_review_url' => 'https://g.page/r/example/review',
        ]);

        $response = $this->postJson('/api/public/reviews', [
            'tenant_id' => $this->tenantA->id,
            'rating'    => 2,
            'comment'   => 'Cold food and bad service',
        ]);

        $response->assertStatus(201);

        $json = $response->json();
        $this->assertArrayNotHasKey('redirect_url', $json, 'Low rating review (1-3 stars) should NOT return google_review_url redirect link!');
    }

    /* =========================================================================
     * 3. RULE-BASED UPSELLING TESTS
     * ========================================================================= */

    public function test_upsell_rule_unique_constraint_enforcement()
    {
        $cat = MenuCategory::create(['tenant_id' => $this->tenantA->id, 'name' => 'Mains']);
        $item1 = MenuItem::create(['tenant_id' => $this->tenantA->id, 'category_id' => $cat->id, 'name' => 'Burger', 'price' => 10]);
        $item2 = MenuItem::create(['tenant_id' => $this->tenantA->id, 'category_id' => $cat->id, 'name' => 'Fries', 'price' => 4]);

        $payload = [
            'item_id'           => $item1->id,
            'suggested_item_id' => $item2->id,
        ];

        // First creation
        $res1 = $this->withHeaders($this->authHeaders($this->tenantA))
                     ->postJson('/api/tenant/upsell-rules', $payload);
        $res1->assertStatus(201);

        // Duplicate creation attempt
        $res2 = $this->withHeaders($this->authHeaders($this->tenantA))
                     ->postJson('/api/tenant/upsell-rules', $payload);

        // Check count in database is exactly 1 (unique constraint enforced)
        $count = UpsellRule::where('tenant_id', $this->tenantA->id)
            ->where('item_id', $item1->id)
            ->where('suggested_item_id', $item2->id)
            ->count();

        $this->assertEquals(1, $count, 'Duplicate upsell rule should not create a second database row');
    }

    public function test_upsell_rule_unauthorized_creation_for_another_tenant_items()
    {
        // Items belong to Tenant B
        $catB = MenuCategory::create(['tenant_id' => $this->tenantB->id, 'name' => 'Drinks']);
        $itemB1 = MenuItem::create(['tenant_id' => $this->tenantB->id, 'category_id' => $catB->id, 'name' => 'Coke', 'price' => 2]);
        $itemB2 = MenuItem::create(['tenant_id' => $this->tenantB->id, 'category_id' => $catB->id, 'name' => 'Juice', 'price' => 3]);

        // Tenant A tries to create upsell rule for Tenant B's items
        $payload = [
            'item_id'           => $itemB1->id,
            'suggested_item_id' => $itemB2->id,
        ];

        $response = $this->withHeaders($this->authHeaders($this->tenantA))
                         ->postJson('/api/tenant/upsell-rules', $payload);

        $response->assertStatus(422)
                 ->assertJsonFragment(['message' => 'Both items must belong to your tenant menu.']);
    }

    public function test_upsell_rule_cross_tenant_mixed_items()
    {
        $catA = MenuCategory::create(['tenant_id' => $this->tenantA->id, 'name' => 'Mains']);
        $itemA = MenuItem::create(['tenant_id' => $this->tenantA->id, 'category_id' => $catA->id, 'name' => 'Burger', 'price' => 10]);

        $catB = MenuCategory::create(['tenant_id' => $this->tenantB->id, 'name' => 'Drinks']);
        $itemB = MenuItem::create(['tenant_id' => $this->tenantB->id, 'category_id' => $catB->id, 'name' => 'Coke', 'price' => 2]);

        // Tenant A item + Tenant B item
        $payload = [
            'item_id'           => $itemA->id,
            'suggested_item_id' => $itemB->id,
        ];

        $response = $this->withHeaders($this->authHeaders($this->tenantA))
                         ->postJson('/api/tenant/upsell-rules', $payload);

        $response->assertStatus(422)
                 ->assertJsonFragment(['message' => 'Both items must belong to your tenant menu.']);
    }

    /* =========================================================================
     * 4. MULTI-LANGUAGE TRANSLATION TESTS
     * ========================================================================= */

    public function test_translation_empty_input()
    {
        // Missing texts parameter
        $resMissing = $this->postJson('/api/public/translate', ['target_lang' => 'es']);
        $resMissing->assertStatus(422)->assertJsonValidationErrors(['texts']);

        // Empty array texts
        $resEmptyArray = $this->postJson('/api/public/translate', ['target_lang' => 'es', 'texts' => []]);
        $resEmptyArray->assertStatus(422)->assertJsonValidationErrors(['texts']);

        // Empty string in array
        $resEmptyString = $this->postJson('/api/public/translate', ['target_lang' => 'es', 'texts' => ['']]);
        $resEmptyString->assertStatus(200);
    }

    public function test_translation_array_of_strings()
    {
        $payload = [
            'target_lang' => 'es',
            'texts'       => ['Burger', 'Water', 'Bill', 'Salad'],
        ];

        $response = $this->postJson('/api/public/translate', $payload);

        $response->assertStatus(200)
                 ->assertJson([
                     'target_lang'  => 'es',
                     'translations' => ['Hamburguesa', 'Agua', 'Cuenta', 'Ensalada'],
                 ]);
    }

    public function test_translation_unsupported_languages()
    {
        $payload = [
            'target_lang' => 'ja', // Japanese (not in dictionary)
            'texts'       => ['Burger', 'Water'],
        ];

        $response = $this->postJson('/api/public/translate', $payload);

        $response->assertStatus(200)
                 ->assertJson([
                     'target_lang'  => 'ja',
                     'translations' => ['[ja] Burger', '[ja] Water'],
                 ]);
    }
}
