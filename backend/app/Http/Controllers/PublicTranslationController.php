<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PublicTranslationController extends Controller
{
    /**
     * Common dictionary for fallback translations.
     */
    protected array $dictionary = [
        'es' => [
            'Burger' => 'Hamburguesa',
            'Water' => 'Agua',
            'Bill' => 'Cuenta',
            'Waiter' => 'Camarero',
            'Chicken' => 'Pollo',
            'Soup' => 'Sopa',
            'Salad' => 'Ensalada',
            'Dessert' => 'Postre',
            'Beverages' => 'Bebidas',
            'Price' => 'Precio',
            'Menu' => 'Menú',
        ],
        'fr' => [
            'Burger' => 'Burger',
            'Water' => 'Eau',
            'Bill' => 'Addition',
            'Waiter' => 'Serveur',
            'Chicken' => 'Poulet',
            'Soup' => 'Soupe',
            'Salad' => 'Salade',
            'Dessert' => 'Dessert',
            'Beverages' => 'Boissons',
            'Price' => 'Prix',
            'Menu' => 'Menu',
        ],
        'de' => [
            'Burger' => 'Burger',
            'Water' => 'Wasser',
            'Bill' => 'Rechnung',
            'Waiter' => 'Kellner',
            'Chicken' => 'Hähnchen',
            'Soup' => 'Suppe',
            'Salad' => 'Salat',
            'Dessert' => 'Nachtisch',
            'Beverages' => 'Getränke',
            'Price' => 'Preis',
            'Menu' => 'Speisekarte',
        ],
    ];

    public function translate(Request $request)
    {
        $request->validate([
            'target_lang' => 'required|string',
            'texts'       => 'required',
        ]);

        $targetLang = strtolower($request->target_lang);
        $rawTexts = $request->texts;
        $texts = is_array($rawTexts) ? $rawTexts : [$rawTexts];

        $apiKey = config('services.google_translate.key') ?? env('GOOGLE_TRANSLATE_API_KEY');

        if ($apiKey) {
            try {
                $response = Http::post("https://translation.googleapis.com/language/translate/v2?key={$apiKey}", [
                    'q'      => $texts,
                    'target' => $targetLang,
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $translated = array_map(function ($item) {
                        return $item['translatedText'];
                    }, $data['data']['translations'] ?? []);

                    return response()->json([
                        'target_lang'      => $targetLang,
                        'translations'     => $translated,
                        'translated_texts' => $translated,
                    ]);
                }
            } catch (\Throwable $e) {
                // Fall through to fallback translation service
            }
        }

        // Fallback to free Google Translate web endpoint via stichoza/google-translate-php
        try {
            $tr = new \Stichoza\GoogleTranslate\GoogleTranslate();
            $tr->setOptions(['timeout' => 8]); // 8 seconds timeout to prevent 30s fatal error
            $tr->setSource('en');
            $tr->setTarget($targetLang);
            
            // Filter string texts
            $stringIndices = [];
            $stringsToTranslate = [];
            foreach ($texts as $index => $text) {
                if (is_string($text) && !empty(trim($text))) {
                    $stringIndices[] = $index;
                    $stringsToTranslate[] = trim($text);
                }
            }

            $translations = $texts; // initialize with original

            if (count($stringsToTranslate) > 0) {
                // Join with a unique delimiter that Google Translate usually preserves
                $delimiter = " \n ";
                $combinedText = implode($delimiter, $stringsToTranslate);
                
                $translatedCombined = $tr->translate($combinedText);
                
                // Split back
                $translatedArray = explode("\n", $translatedCombined);
                
                // Map back to original indices
                foreach ($stringIndices as $i => $originalIndex) {
                    if (isset($translatedArray[$i])) {
                        $translations[$originalIndex] = trim($translatedArray[$i]);
                    }
                }
            }
            
            return response()->json([
                'target_lang'      => $targetLang,
                'translations'     => array_values($translations),
                'translated_texts' => array_values($translations),
            ]);
        } catch (\Throwable $e) {
            // Final fallback if free translation also fails
            $translations = [];
            foreach ($texts as $text) {
                if (!is_string($text)) {
                    $translations[] = $text;
                    continue;
                }
                if (isset($this->dictionary[$targetLang][$text])) {
                    $translations[] = $this->dictionary[$targetLang][$text];
                } else {
                    $translations[] = "[{$targetLang}] {$text}";
                }
            }

            return response()->json([
                'target_lang'      => $targetLang,
                'translations'     => $translations,
                'translated_texts' => $translations,
            ]);
        }
    }
}
