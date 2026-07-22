<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\TenantSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_successfully()
    {
        $payload = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'restaurant_name' => 'Johns Restaurant',
            'slug' => 'johns-restaurant'
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'access_token',
                     'token_type',
                     'expires_in',
                     'user' => [
                         'id',
                         'name',
                         'email',
                         'role',
                     ]
                 ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'role' => 'tenant'
        ]);

        $this->assertDatabaseHas('tenant_settings', [
            'restaurant_name' => 'Johns Restaurant',
            'slug' => 'johns-restaurant'
        ]);
    }

    public function test_user_cannot_register_with_existing_email()
    {
        User::factory()->create([
            'email' => 'john@example.com'
        ]);

        $payload = [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'restaurant_name' => 'Janes Restaurant',
            'slug' => 'janes-restaurant'
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(422)
                 ->assertJsonStructure(['email']);
    }

    public function test_user_can_login_successfully()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'role' => 'tenant',
            'is_active' => true,
            'is_suspended' => false,
        ]);

        $payload = [
            'email' => 'test@example.com',
            'password' => 'password123'
        ];

        $response = $this->postJson('/api/login', $payload);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'access_token',
                     'token_type',
                     'expires_in',
                     'user' => [
                         'id',
                         'name',
                         'email',
                     ]
                 ]);
    }

    public function test_user_cannot_login_with_invalid_credentials()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $payload = [
            'email' => 'test@example.com',
            'password' => 'wrongpassword'
        ];

        $response = $this->postJson('/api/login', $payload);

        $response->assertStatus(401)
                 ->assertJson(['error' => 'Incorrect email or password.']);
    }

    public function test_deactivated_user_cannot_login()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'is_active' => false,
            'is_suspended' => false,
        ]);

        $payload = [
            'email' => 'test@example.com',
            'password' => 'password123'
        ];

        $response = $this->postJson('/api/login', $payload);

        $response->assertStatus(403)
                 ->assertJson(['error' => 'Your account has been deactivated by the administrator.']);
    }

    public function test_suspended_user_cannot_login()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'is_active' => true,
            'is_suspended' => true,
        ]);

        $payload = [
            'email' => 'test@example.com',
            'password' => 'password123'
        ];

        $response = $this->postJson('/api/login', $payload);

        $response->assertStatus(403)
                 ->assertJson(['error' => 'Your account is suspended. Please contact support.']);
    }
}
