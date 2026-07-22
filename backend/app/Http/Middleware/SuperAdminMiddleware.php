<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth('api')->check() || auth('api')->user()->role !== 'super_admin') {
            \Illuminate\Support\Facades\Log::info('SuperAdminMiddleware blocked request', [
                'is_auth' => auth('api')->check(),
                'role' => auth('api')->check() ? auth('api')->user()->role : 'none',
                'user_id' => auth('api')->check() ? auth('api')->id() : null
            ]);
            return response()->json(['error' => 'Unauthorized. Super Admin access required.'], 403);
        }

        return $next($request);
    }
}
