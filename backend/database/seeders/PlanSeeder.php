<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'price' => 15,
                'currency' => 'USD',
                'duration_months' => 1,
                'features' => json_encode(['Up to 50 Menu Items', '1 Language']),
                'max_menu_items' => 50,
                'max_languages' => 1,
                'has_custom_qr' => false,
                'has_analytics' => false,
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'price' => 29,
                'currency' => 'USD',
                'duration_months' => 1,
                'features' => json_encode(['Unlimited Menu Items', 'Up to 3 Languages', 'Custom Branded QR']),
                'max_menu_items' => null,
                'max_languages' => 3,
                'has_custom_qr' => true,
                'has_analytics' => false,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'price' => 79,
                'currency' => 'USD',
                'duration_months' => 1,
                'features' => json_encode(['Everything in Pro', 'Advanced Analytics API']),
                'max_menu_items' => null,
                'max_languages' => null,
                'has_custom_qr' => true,
                'has_analytics' => true,
            ],
        ];

        foreach ($plans as $plan) {
            \App\Models\Plan::updateOrCreate(
                ['name' => $plan['name']],
                $plan
            );
        }
    }
}
