<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable;

class TenantSetting extends Model implements Auditable
{
    use \OwenIt\Auditing\Auditable, \Illuminate\Database\Eloquent\Concerns\HasUuids;
    protected $guarded = [];

    protected $fillable = [
        'user_id',
        'slug',
        'restaurant_name',
        'logo_url',
        'banner_url',
        'primary_color',
        'secondary_color',
        'font_family',
        'currency',
        'address',
        'timezone',
        'theme_mode',
        'payhere_merchant_id',
        'payhere_merchant_secret',
        'payhere_app_id',
        'payhere_app_secret',
        'payhere_enabled',
        'google_review_url',
    ];

    // Settings are tied to the user via user_id, so we don't necessarily need the global TenantScope here if we fetch via $user->settings()
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
