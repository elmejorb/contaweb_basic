<?php

namespace App\Models\V2;

use Illuminate\Database\Eloquent\Model;

class Compra extends Model
{
    protected $table = 'compras';
    protected $primaryKey = 'id';

    protected $fillable = [
        'empresa_id', 'codigo_externo',
        'numero_factura', 'proveedor_id', 'forma_pago_id',
        'fecha', 'dias_credito',
        'subtotal', 'descuento', 'impuesto', 'flete', 'total',
        'abono', 'saldo',
        'estado', 'observaciones',
        'origen', 'fecha_actualizacion_origen',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'subtotal'  => 'decimal:2',
        'descuento' => 'decimal:2',
        'impuesto'  => 'decimal:2',
        'flete'     => 'decimal:2',
        'total'     => 'decimal:2',
        'abono'     => 'decimal:2',
        'saldo'     => 'decimal:2',
        'fecha_actualizacion_origen' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(CompraItem::class, 'compra_id');
    }
}
