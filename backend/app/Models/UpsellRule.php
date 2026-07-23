<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UpsellRule extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'item_id',
        'suggested_item_id',
    ];

    public function tenant()
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    public function item()
    {
        return $this->belongsTo(MenuItem::class, 'item_id');
    }

    public function suggestedItem()
    {
        return $this->belongsTo(MenuItem::class, 'suggested_item_id');
    }
}
