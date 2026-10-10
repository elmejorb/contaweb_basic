<?php

namespace App\Models\V2;

use Illuminate\Database\Eloquent\Model;

class SyncBatch extends Model
{
    protected $table = 'sync_batches';
    public $timestamps = false;

    protected $fillable = [
        'empresa_id',
        'entidad',
        'cantidad_items',
        'aceptados',
        'rechazados',
        'duplicados',
        'ip_origen',
        'recibido_at',
    ];

    protected $casts = [
        'recibido_at' => 'datetime',
    ];
}
