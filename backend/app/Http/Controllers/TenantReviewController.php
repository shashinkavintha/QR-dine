<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;

class TenantReviewController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = config('tenant.id') ?? $request->user()->tenant_id ?? $request->user()->id;

        $query = Review::where('tenant_id', $tenantId);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $reviews = $query->orderBy('created_at', 'desc')->get();

        return response()->json($reviews);
    }

    public function markAsRead(Request $request, $id)
    {
        $tenantId = config('tenant.id') ?? $request->user()->tenant_id ?? $request->user()->id;

        $review = Review::where('tenant_id', $tenantId)->findOrFail($id);
        
        $status = $request->input('status', 'read');
        $review->update(['status' => $status]);

        return response()->json([
            'message' => 'Review updated successfully',
            'review'  => $review,
        ]);
    }
}
