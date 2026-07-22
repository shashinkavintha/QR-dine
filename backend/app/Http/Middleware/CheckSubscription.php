<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscription
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth('api')->user();

        // Let Super Admin pass
        if ($user && $user->role === 'super_admin') {
            return $next($request);
        }

        if ($user && in_array($user->role, ['tenant', 'staff'])) {
            $tenantId = $user->role === 'tenant' ? $user->id : $user->tenant_id;
            $owner = \App\Models\User::find($tenantId);

            if ($owner) {
                // Allow them to fetch their settings or billing to upgrade
                $allowedPaths = [
                    'api/tenant/settings',
                    'api/tenant/billing/payhere-checkout',
                    'api/tenant/billing/simulate-payment',
                    'api/tenant/subscriptions/bank-transfer'
                ];

                if (in_array($request->path(), $allowedPaths)) {
                    return $next($request);
                }

                // Check expiration
                $expiry = \Carbon\Carbon::parse($owner->plan_expires_at ?? $owner->trial_ends_at);
                if ($expiry->isPast()) {
                    return response()->json([
                        'error' => 'Subscription expired. Please renew your plan.',
                        'subscription_expired' => true
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
