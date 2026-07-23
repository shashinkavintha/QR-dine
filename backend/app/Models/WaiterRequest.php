<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaiterRequest extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'table_id',
        'table_number',
        'request_type',
        'note',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    public function table()
    {
        return $this->belongsTo(TableQr::class, 'table_id');
    }
}
