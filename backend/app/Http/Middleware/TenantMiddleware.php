<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth('api')->check()) {
            // Set the tenant ID globally for the current request
            // If the user is staff, they will have a tenant_id. If they are the owner, they are the tenant.
            $tenantId = auth('api')->user()->tenant_id ?? auth('api')->id();
            Config::set('tenant.id', $tenantId);
        }

        try {
            return $next($request);
        } finally {
            Config::set('tenant.id', null);
        }
    }
}
