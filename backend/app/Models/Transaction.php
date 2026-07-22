<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUuids;

    protected $fillable = [
        'user_id',
        'transaction_id',
        'amount',
        'status',
        'date',
        'payment_method',
        'payment_slip_path',
        'plan_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
