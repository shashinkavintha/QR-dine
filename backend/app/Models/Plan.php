<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Plan extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['name', 'slug', 'price', 'currency', 'duration_months', 'features', 'max_menu_items', 'max_languages', 'has_custom_qr', 'has_analytics', 'max_tables'];

    protected $casts = [
        'features' => 'array',
    ];
}
