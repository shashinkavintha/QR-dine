<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable;

class TenantSetting extends Model implements Auditable
{
    use \OwenIt\Auditing\Auditable, \Illuminate\Database\Eloquent\Concerns\HasUuids;
    protected $guarded = [];

    // Settings are tied to the user via user_id, so we don't necessarily need the global TenantScope here if we fetch via $user->settings()
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
