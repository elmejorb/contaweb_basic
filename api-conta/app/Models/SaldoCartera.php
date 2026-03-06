<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaldoCartera extends Model
{
    protected $table = 'saldos_cartera';
    protected $primaryKey = 'id_saldo_cartera';

    protected $fillable = [
        'id_empresa',
        'codigo_tercero',
        'nombre_tercero',
        'tipo',
        'saldo_total'
    ];

    protected $casts = [
        'saldo_total' => 'decimal:2'
    ];

    /**
     * Relación con Empresa
     */
    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }
}
