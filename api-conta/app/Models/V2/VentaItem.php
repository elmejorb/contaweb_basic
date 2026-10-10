<?php

namespace App\Models\V2;

use Illuminate\Database\Eloquent\Model;

class VentaItem extends Model
{
    protected $table = 'venta_items';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'venta_id', 'producto_id',
        'descripcion', 'cantidad',
        'precio_costo', 'precio_venta', 'descuento',
        'porcentaje_iva', 'impuesto', 'subtotal', 'total',
        'utilidad', 'entregado',
    ];

    protected $casts = [
        'cantidad'       => 'decimal:2',
        'precio_costo'   => 'decimal:4',
        'precio_venta'   => 'decimal:2',
        'descuento'      => 'decimal:2',
        'porcentaje_iva' => 'decimal:2',
        'impuesto'       => 'decimal:2',
        'subtotal'       => 'decimal:2',
        'total'          => 'decimal:2',
        'utilidad'       => 'decimal:2',
        'entregado'      => 'boolean',
    ];
}
