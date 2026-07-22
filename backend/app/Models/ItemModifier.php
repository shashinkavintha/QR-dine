<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
class ItemModifier extends Model
{
    use \Illuminate\Database\Eloquent\Concerns\HasUuids;
    protected $guarded = [];

    protected $casts = [
        'options' => 'array',
        'is_multiple_choice' => 'boolean',
        'is_required' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);
    }
}
