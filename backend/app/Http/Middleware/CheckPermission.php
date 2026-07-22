<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = auth('api')->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        if (!$user->is_active) {
            return response()->json(['error' => 'Account is deactivated'], 403);
        }

        // Tenant owner has all permissions
        if ($user->role === 'tenant') {
            return $next($request);
        }

        // Check staff permissions
        if ($user->role === 'staff') {
            // Eager load roles and permissions if not already loaded
            if (!$user->relationLoaded('roles')) {
                $user->load('roles.permissions');
            }

            $hasPermission = $user->roles->flatMap->permissions->pluck('name')->contains($permission);

            if (!$hasPermission) {
                return response()->json(['error' => 'Forbidden. Missing permission: ' . $permission], 403);
            }
        }

        return $next($request);
    }
}
