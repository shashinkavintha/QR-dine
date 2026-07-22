<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFeatureLimits
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, $feature): Response
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $tenantId = config('tenant.id') ?? $user->id;
        $owner = \App\Models\User::find($tenantId);
        $plan = $owner ? $owner->plan : null;
        
        if ($feature === 'menu_items') {
            $maxItems = $plan ? $plan->max_menu_items : 50; // default 50 for trial
            if ($maxItems !== null) { // null means unlimited
                $currentCount = \App\Models\MenuItem::where('tenant_id', $tenantId)->count();
                if ($currentCount >= $maxItems) {
                    return response()->json(['error' => "You have reached the maximum number of menu items allowed on your current plan ($maxItems). Please upgrade to add more."], 403);
                }
            }
        }
        
        return $next($request);
    }
}
