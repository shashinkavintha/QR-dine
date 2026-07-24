<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\TenantSetting;
use Illuminate\Http\Request;

class PublicReviewController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tenant_id'     => 'required|uuid|exists:users,id',
            'rating'        => 'required|integer|min:1|max:5',
            'comment'       => 'nullable|string',
            'customer_name' => 'nullable|string|max:255',
        ]);

        $setting = TenantSetting::where('user_id', $validated['tenant_id'])->first();
        $googleUrl = $setting?->google_review_url;

        // If rating is 1..3, it's a complaint review. Save to DB.
        if ($validated['rating'] <= 3) {
            $validated['status'] = 'unread';
            $review = Review::create($validated);

            $response = [
                'message' => 'Thank you for your feedback.',
                'review'  => $review,
            ];

            return response()->json($response, 201);
        }

        // High rating (4 or 5 star)
        $validated['status'] = 'unread';
        $review = Review::create($validated);

        $response = [
            'message' => 'Thank you for your positive review!',
            'review'  => $review,
        ];

        if ($googleUrl) {
            $response['redirect_url'] = $googleUrl;
        }

        return response()->json($response, 201);
    }
}
