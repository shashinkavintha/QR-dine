<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('tenant.orders.{tenantId}', function ($user, $tenantId) {
    // Only super admins or users belonging to the tenant can listen
    return $user->role === 'super_admin' || $user->id === $tenantId || $user->tenant_id === $tenantId;
});

Broadcast::channel('tenant.status.{tenantId}', function ($user, $tenantId) {
    // Only super admins or users belonging to the tenant can listen
    return $user->role === 'super_admin' || (int) $user->id === (int) $tenantId || (int) $user->tenant_id === (int) $tenantId;
});
