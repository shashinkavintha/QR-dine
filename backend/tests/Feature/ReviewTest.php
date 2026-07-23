<?php

namespace Tests\Feature;

use App\Models\Review;
use App\Models\TenantSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;
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

        $this->token = auth('api')->login($this->tenant);
    }

    public function test_public_review_saves_complaint_to_db_for_low_rating()
    {
        TenantSetting::create([
            'user_id'           => $this->tenant->id,
            'slug'              => 'hotel-' . $this->tenant->id,
            'google_review_url' => 'https://maps.google.com/review',
        ]);

        $payload = [
            'tenant_id'     => $this->tenant->id,
            'rating'        => 2,
            'comment'       => 'Slow service and cold food',
            'customer_name' => 'John Doe',
        ];

        $response = $this->postJson('/api/public/reviews', $payload);

        $response->assertStatus(201)
                 ->assertJsonFragment([
                     'message' => 'Thank you for your feedback.',
                 ])
                 ->assertJsonMissing(['redirect_url' => 'https://maps.google.com/review']);

        $this->assertDatabaseHas('reviews', [
            'tenant_id'     => $this->tenant->id,
            'rating'        => 2,
            'comment'       => 'Slow service and cold food',
            'customer_name' => 'John Doe',
            'status'        => 'unread',
        ]);
    }

    public function test_public_review_returns_redirect_url_for_high_rating_when_google_url_set()
    {
        TenantSetting::create([
            'user_id'           => $this->tenant->id,
            'slug'              => 'hotel-' . $this->tenant->id,
            'google_review_url' => 'https://g.page/r/example/review',
        ]);

        $payload = [
            'tenant_id' => $this->tenant->id,
            'rating'    => 5,
            'comment'   => 'Amazing food!',
        ];

        $response = $this->postJson('/api/public/reviews', $payload);

        $response->assertStatus(201)
                 ->assertJsonFragment([
                     'redirect_url' => 'https://g.page/r/example/review',
                 ]);
    }

    public function test_tenant_can_list_complaint_reviews()
    {
        Review::create([
            'tenant_id' => $this->tenant->id,
            'rating'    => 1,
            'comment'   => 'Terrible experience',
            'status'    => 'unread',
        ]);

        Review::create([
            'tenant_id' => $this->tenant->id,
            'rating'    => 5,
            'comment'   => 'Awesome!',
            'status'    => 'read',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/tenant/reviews');

        $response->assertStatus(200)
                 ->assertJsonFragment(['comment' => 'Terrible experience'])
                 ->assertJsonMissing(['comment' => 'Awesome!']);
    }

    public function test_tenant_can_mark_review_as_read()
    {
        $review = Review::create([
            'tenant_id' => $this->tenant->id,
            'rating'    => 2,
            'comment'   => 'Needs improvement',
            'status'    => 'unread',
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->putJson("/api/tenant/reviews/{$review->id}/read");

        $response->assertStatus(200)
                 ->assertJsonFragment(['status' => 'read']);

        $this->assertDatabaseHas('reviews', [
            'id'     => $review->id,
            'status' => 'read',
        ]);
    }

    public function test_tenant_can_save_google_review_url_in_settings()
    {
        TenantSetting::create([
            'user_id' => $this->tenant->id,
            'slug'    => 'hotel-' . $this->tenant->id,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/tenant/settings', [
            'google_review_url' => 'https://g.page/r/myhotel/review',
        ]);

        $response->assertStatus(200)
                 ->assertJsonFragment(['google_review_url' => 'https://g.page/r/myhotel/review']);

        $this->assertDatabaseHas('tenant_settings', [
            'user_id'           => $this->tenant->id,
            'google_review_url' => 'https://g.page/r/myhotel/review',
        ]);
    }
}
