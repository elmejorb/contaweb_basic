<?php

namespace App\Models\V2;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Cliente v2 — esquema limpio snake_case.
 * Reemplaza App\Models\Cliente (v1). PK = id (no id_cliente).
 */
class Cliente extends Model
{
    use SoftDeletes;

    protected $table = 'clientes';
    protected $primaryKey = 'id';

    protected $fillable = [
        'empresa_id',
        'codigo_externo',
        'razon_social',
        'tipo_documento_id',
        'numero_documento',
        'dv',
        'nombres',
        'apellidos',
        'email',
        'telefono',
        'celular',
        'whatsapp',
        'direccion',
        'ciudad',
        'cupo_credito',
        'dias_credito',
        'fecha_nacimiento',
        'vendedor_id',
        'factura_a_precio_costo',
        'activo',
        'origen',
        'fecha_actualizacion_origen',
    ];

    protected $casts = [
        'cupo_credito' => 'decimal:2',
        'dias_credito' => 'integer',
        'factura_a_precio_costo' => 'boolean',
        'activo' => 'boolean',
        'fecha_nacimiento' => 'date',
        'fecha_actualizacion_origen' => 'datetime',
    ];
}
