<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \OwenIt\Auditing\Models\Audit::creating(function (\OwenIt\Auditing\Models\Audit $audit) {
            if (empty($audit->tenant_id)) {
                $auditable = $audit->auditable;
                if ($auditable && isset($auditable->tenant_id)) {
                    $audit->tenant_id = $auditable->tenant_id;
                } elseif (auth()->check() && isset(auth()->user()->tenant_id)) {
                    $audit->tenant_id = auth()->user()->tenant_id;
                }
            }
        });
    }
}
