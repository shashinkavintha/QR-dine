<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTokenVersion
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth('api')->check()) {
            $payload = auth('api')->payload();
            $tokenVersion = $payload->get('token_version');
            $user = auth('api')->user();

            if ($user && $tokenVersion !== $user->token_version) {
                auth('api')->logout();
                return response()->json(['error' => 'Token has expired due to new login'], 401);
            }
        }
        return $next($request);
    }
}
