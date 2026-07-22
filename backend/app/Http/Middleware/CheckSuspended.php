<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSuspended
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth('api')->user() ?? $request->user();
        if ($user) {
            $tenantId = $user->role === 'tenant' ? $user->id : $user->tenant_id;
            $owner = \App\Models\User::find($tenantId);
            if ($owner && $owner->is_suspended && !$request->isMethod('get')) {
                \Illuminate\Support\Facades\Log::info('CheckSuspended blocked request', ['user_id' => $user->id, 'is_suspended' => $owner->is_suspended]);
                return response()->json(['error' => 'Your account is suspended. Modifications are disabled.'], 403);
            }
        }
        return $next($request);
    }
}
