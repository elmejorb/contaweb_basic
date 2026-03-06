<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    protected $table = 'pagos';
    protected $primaryKey = 'id_pago';

    protected $fillable = [
        'id_empresa',
        'id_pago_vb6',
        'rec_caja_n',
        'codigo_cliente',
        'factura_n',
        'valor_pago',
        'fecha',
        'detalle_pago',
        'valor_factura',
        'saldo_actual',
        'descuento',
        'retencion',
        'iva_retenido',
        'estado',
        'saldo_total',
        'cedula',
        'recibido_de',
    ];

    protected $casts = [
        'valor_pago' => 'decimal:4',
        'valor_factura' => 'decimal:4',
        'saldo_actual' => 'decimal:4',
        'descuento' => 'decimal:4',
        'retencion' => 'decimal:4',
        'iva_retenido' => 'decimal:4',
        'saldo_total' => 'decimal:4',
        'fecha' => 'date',
    ];
}
