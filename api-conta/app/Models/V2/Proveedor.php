<?php

namespace App\Models\V2;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Proveedor extends Model
{
    use SoftDeletes;

    protected $table = 'proveedores';
    protected $primaryKey = 'id';

    protected $fillable = [
        'empresa_id', 'codigo_externo',
        'razon_social', 'tipo_documento_id', 'numero_documento', 'dv',
        'email', 'telefono', 'direccion', 'ciudad', 'cuenta_bancaria',
        'activo', 'origen', 'fecha_actualizacion_origen',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'fecha_actualizacion_origen' => 'datetime',
    ];
}
