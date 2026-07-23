<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'rating',
        'comment',
        'customer_name',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }
}
