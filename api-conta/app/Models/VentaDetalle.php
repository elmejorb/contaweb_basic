<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VentaDetalle extends Model
{
    protected $table = 'detalles_venta';
    protected $primaryKey = 'id_detalle';
    public $timestamps = true;

    protected $fillable = [
        'id_venta',
        'id_producto',
        'codvb6_producto',
        'descripcion_temp',
        'nombre_producto',
        'cantidad',
        'cantidad_devolucion',
        'precio_unitario',
        'precio_costo',
        'subtotal',
        'descuento',
        'impuesto',
        'porcentaje_iva',
        'total'
    ];

    protected $casts = [
        'cantidad' => 'float',
        'cantidad_devolucion' => 'float',
        'precio_unitario' => 'decimal:4',
        'precio_costo' => 'decimal:4',
        'subtotal' => 'decimal:4',
        'descuento' => 'decimal:4',
        'impuesto' => 'decimal:4',
        'porcentaje_iva' => 'decimal:2',
        'total' => 'decimal:4'
    ];

    /**
     * Relación con venta
     */
    public function venta()
    {
        return $this->belongsTo(Venta::class, 'id_venta', 'id_venta');
    }

    /**
     * Relación con producto
     */
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto', 'id_producto');
    }

    /**
     * Obtiene el nombre a mostrar en la factura
     * Si es un servicio con descripcion_temp, muestra esa descripción
     * De lo contrario, muestra el nombre_producto (snapshot histórico)
     */
    public function getNombreMostrarAttribute()
    {
        return !empty($this->descripcion_temp) ? $this->descripcion_temp : $this->nombre_producto;
    }
}
