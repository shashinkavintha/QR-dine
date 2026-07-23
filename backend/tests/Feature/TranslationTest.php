<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TranslationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_translation_service_returns_fallback_translations()
    {
        $payload = [
            'target_lang' => 'es',
            'texts'       => ['Burger', 'Water', 'Bill'],
        ];

        $response = $this->postJson('/api/public/translate', $payload);

        $response->assertStatus(200)
                 ->assertJson([
                     'target_lang'  => 'es',
                     'translations' => ['Hamburguesa', 'Agua', 'Cuenta'],
                 ]);
    }

    public function test_public_translation_service_handles_unknown_words()
    {
        $payload = [
            'target_lang' => 'fr',
            'texts'       => ['Special Dish'],
        ];

        $response = $this->postJson('/api/public/translate', $payload);

        $response->assertStatus(200)
                 ->assertJson([
                     'target_lang'  => 'fr',
                     'translations' => ['[fr] Special Dish'],
                 ]);
    }
}
