<?php

namespace App\Models\V2;

use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    protected $table = 'ventas';
    protected $primaryKey = 'id';

    protected $fillable = [
        'empresa_id', 'codigo_externo',
        'numero_factura', 'prefijo',
        'cliente_id', 'vendedor_id', 'forma_pago_id',
        'fecha', 'dias_credito',
        'subtotal', 'descuento', 'impuesto', 'total',
        'abono', 'saldo', 'utilidad', 'costo_total',
        'estado', 'es_electronica', 'cufe', 'observaciones',
        'origen', 'fecha_actualizacion_origen',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'subtotal'    => 'decimal:2',
        'descuento'   => 'decimal:2',
        'impuesto'    => 'decimal:2',
        'total'       => 'decimal:2',
        'abono'       => 'decimal:2',
        'saldo'       => 'decimal:2',
        'utilidad'    => 'decimal:2',
        'costo_total' => 'decimal:2',
        'es_electronica' => 'boolean',
        'fecha_actualizacion_origen' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(VentaItem::class, 'venta_id');
    }
}
