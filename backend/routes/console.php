<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

\Illuminate\Support\Facades\Schedule::command('app:expire-subscriptions')->daily();

\Illuminate\Support\Facades\Schedule::call(function () {
    \OwenIt\Auditing\Models\Audit::where('created_at', '<', now()->subDays(90))->delete();
})->daily();

\Illuminate\Support\Facades\Schedule::call(function () {
    // Purge recycle bin (soft deleted items/categories) older than 30 days
    \App\Models\MenuItem::onlyTrashed()->where('deleted_at', '<', now()->subDays(30))->forceDelete();
    \App\Models\MenuCategory::onlyTrashed()->where('deleted_at', '<', now()->subDays(30))->forceDelete();
})->daily();
