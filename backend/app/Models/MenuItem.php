<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Contracts\Auditable;

class MenuItem extends Model implements Auditable
{
    use SoftDeletes, \OwenIt\Auditing\Auditable, \Illuminate\Database\Eloquent\Concerns\HasUuids;
    protected $guarded = [];

    protected $casts = [
        'portions' => 'array',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);
    }

    public function category()
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function modifiers()
    {
        return $this->hasMany(ItemModifier::class, 'menu_item_id');
    }
}
