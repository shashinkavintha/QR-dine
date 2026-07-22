<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class MenuCategory extends Model
{
    use SoftDeletes, \Illuminate\Database\Eloquent\Concerns\HasUuids;
    protected $guarded = [];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);
    }

    public function items()
    {
        return $this->hasMany(MenuItem::class, 'category_id')->orderBy('sort_order');
    }
}
