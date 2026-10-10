<?php

namespace App\Models\V2;

use Illuminate\Database\Eloquent\Model;

class SyncItem extends Model
{
    protected $table = 'sync_items';
    public $timestamps = false;

    protected $fillable = [
        'batch_id',
        'empresa_id',
        'entidad',
        'codigo_externo',
        'idempotency_key',
        'status',
        'id_remoto',
        'error_msg',
        'procesado_at',
    ];

    protected $casts = [
        'procesado_at' => 'datetime',
    ];
}
