<?php

namespace App\Models\V2;

use Illuminate\Database\Eloquent\Model;

class Gasto extends Model
{
    protected $table = 'gastos';
    protected $primaryKey = 'id';

    protected $fillable = [
        'empresa_id', 'codigo_externo',
        'categoria', 'concepto',
        'fecha', 'valor', 'forma_pago_id',
        'beneficiario', 'observaciones',
        'estado',
        'origen', 'fecha_actualizacion_origen',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'valor' => 'decimal:2',
        'fecha_actualizacion_origen' => 'datetime',
    ];
}
