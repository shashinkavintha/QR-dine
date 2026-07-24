<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Plans
        $this->call(PlanSeeder::class);

        // Seed Default Permissions
        $permissions = [
            'manage_menu',
            'view_orders',
            'manage_staff',
            'view_analytics',
            'manage_settings',
            'manage_upsells',
            'manage_reviews'
        ];

        foreach ($permissions as $name) {
            \App\Models\Permission::firstOrCreate(['name' => $name]);
        }

        // Seed Super Admin
        \App\Models\User::firstOrCreate(
            ['email' => 'shashinkavintha@gmail.com'],
            [
                'name' => 'Shashin Kavintha', // Super Admin
                'password' => bcrypt('200323612298@Shashin'), // Fallback secure password
                'role' => 'super_admin'
            ]
        );
    }
}
