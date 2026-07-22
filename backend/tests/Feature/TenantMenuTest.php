<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TenantMenuTest extends TestCase
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
        
        // Assume JWT auth
        $token = auth('api')->login($this->user);
        $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ]);
    }

    public function test_tenant_can_get_menu()
    {
        $category = MenuCategory::create([
            'tenant_id' => $this->user->id,
            'name' => 'Main Course',
            'sort_order' => 1
        ]);

        MenuItem::create([
            'tenant_id' => $this->user->id,
            'category_id' => $category->id,
            'name' => 'Burger',
            'price' => 10,
        ]);

        $response = $this->getJson('/api/tenant/menu');

        $response->assertStatus(200)
                 ->assertJsonFragment(['name' => 'Main Course'])
                 ->assertJsonFragment(['name' => 'Burger']);
    }

    public function test_tenant_can_add_menu_category()
    {
        $payload = [
            'name' => 'Desserts',
            'sort_order' => 2
        ];

        $response = $this->postJson('/api/tenant/menu/categories', $payload);

        $response->assertStatus(200)
                 ->assertJsonFragment(['name' => 'Desserts']);

        $this->assertDatabaseHas('menu_categories', [
            'tenant_id' => $this->user->id,
            'name' => 'Desserts'
        ]);
    }

    public function test_tenant_can_update_menu_category()
    {
        $category = MenuCategory::create([
            'tenant_id' => $this->user->id,
            'name' => 'Old Name',
            'sort_order' => 1
        ]);

        $payload = [
            'name' => 'New Name'
        ];

        $response = $this->putJson('/api/tenant/menu/categories/' . $category->id, $payload);

        $response->assertStatus(200)
                 ->assertJsonFragment(['name' => 'New Name']);

        $this->assertDatabaseHas('menu_categories', [
            'id' => $category->id,
            'name' => 'New Name'
        ]);
    }

    public function test_tenant_can_delete_menu_category()
    {
        $category = MenuCategory::create([
            'tenant_id' => $this->user->id,
            'name' => 'To Delete',
            'sort_order' => 1
        ]);

        $response = $this->deleteJson('/api/tenant/menu/categories/' . $category->id);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        // It should be soft deleted, check if we have deleted_at
        $this->assertDatabaseHas('menu_categories', [
            'id' => $category->id,
        ]);
        $this->assertNotNull(MenuCategory::withTrashed()->find($category->id)->deleted_at);
    }

    public function test_tenant_can_add_menu_item()
    {
        $category = MenuCategory::create([
            'tenant_id' => $this->user->id,
            'name' => 'Drinks',
        ]);

        $payload = [
            'category_id' => $category->id,
            'name' => 'Cola',
            'description' => 'Cold drink',
            'price' => 5,
            'is_available' => true
        ];

        $response = $this->postJson('/api/tenant/menu/items', $payload);

        $response->assertStatus(200)
                 ->assertJsonFragment(['name' => 'Cola']);

        $this->assertDatabaseHas('menu_items', [
            'tenant_id' => $this->user->id,
            'name' => 'Cola',
            'price' => 5
        ]);
    }

    public function test_tenant_can_update_menu_item()
    {
        $category = MenuCategory::create([
            'tenant_id' => $this->user->id,
            'name' => 'Drinks',
        ]);

        $item = MenuItem::create([
            'tenant_id' => $this->user->id,
            'category_id' => $category->id,
            'name' => 'Pepsi',
            'price' => 4,
        ]);

        $payload = [
            'name' => 'Diet Pepsi',
            'price' => 6,
            'category_id' => $category->id,
        ];

        $response = $this->putJson('/api/tenant/menu/items/' . $item->id, $payload);

        $response->assertStatus(200)
                 ->assertJsonFragment(['name' => 'Diet Pepsi']);

        $this->assertDatabaseHas('menu_items', [
            'id' => $item->id,
            'name' => 'Diet Pepsi',
            'price' => 6
        ]);
    }

    public function test_tenant_can_delete_menu_item()
    {
        $category = MenuCategory::create([
            'tenant_id' => $this->user->id,
            'name' => 'Drinks',
        ]);

        $item = MenuItem::create([
            'tenant_id' => $this->user->id,
            'category_id' => $category->id,
            'name' => 'Fanta',
            'price' => 3,
        ]);

        $response = $this->deleteJson('/api/tenant/menu/items/' . $item->id);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertNotNull(MenuItem::withTrashed()->find($item->id)->deleted_at);
    }
}
