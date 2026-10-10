<?php

namespace App\Models\V2;

use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    protected $table = 'pagos';
    protected $primaryKey = 'id';

    protected $fillable = [
        'empresa_id', 'codigo_externo',
        'cliente_id', 'venta_id', 'forma_pago_id',
        'fecha', 'valor', 'descuento', 'retencion',
        'observaciones', 'estado',
        'origen', 'fecha_actualizacion_origen',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'valor' => 'decimal:2',
        'descuento' => 'decimal:2',
        'retencion' => 'decimal:2',
        'fecha_actualizacion_origen' => 'datetime',
    ];
}
