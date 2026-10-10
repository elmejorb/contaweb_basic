<?php

namespace App\Models\V2;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Producto extends Model
{
    use SoftDeletes;

    protected $table = 'productos';
    protected $primaryKey = 'id';

    protected $fillable = [
        'empresa_id', 'codigo_externo', 'codigo', 'codigo_barras',
        'nombre', 'descripcion',
        'categoria_id', 'impuesto_id', 'unidad_medida_id',
        'precio_costo', 'precio_venta', 'precio_venta_2', 'precio_venta_3', 'precio_minimo',
        'existencia', 'existencia_minima',
        'es_servicio', 'activo',
        'origen', 'fecha_actualizacion_origen',
    ];

    protected $casts = [
        'precio_costo'      => 'decimal:4',
        'precio_venta'      => 'decimal:2',
        'precio_venta_2'    => 'decimal:2',
        'precio_venta_3'    => 'decimal:2',
        'precio_minimo'     => 'decimal:2',
        'existencia'        => 'decimal:2',
        'existencia_minima' => 'decimal:2',
        'es_servicio'       => 'boolean',
        'activo'            => 'boolean',
        'fecha_actualizacion_origen' => 'datetime',
    ];
}
