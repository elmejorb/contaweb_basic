<?php

namespace App\Models\V2;

use Illuminate\Database\Eloquent\Model;

class CompraItem extends Model
{
    protected $table = 'compra_items';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'compra_id', 'producto_id',
        'descripcion', 'cantidad',
        'precio_costo', 'descuento',
        'porcentaje_iva', 'impuesto', 'subtotal', 'total',
    ];

    protected $casts = [
        'cantidad'       => 'decimal:2',
        'precio_costo'   => 'decimal:4',
        'descuento'      => 'decimal:2',
        'porcentaje_iva' => 'decimal:2',
        'impuesto'       => 'decimal:2',
        'subtotal'       => 'decimal:2',
        'total'          => 'decimal:2',
    ];
}
