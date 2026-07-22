<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Config;

class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // Get the current tenant ID set in the config by our middleware
        if ($tenantId = Config::get('tenant.id')) {
            $builder->where($model->getTable() . '.tenant_id', $tenantId);
        }
    }
}
