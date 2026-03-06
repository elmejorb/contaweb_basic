<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovimientoCaja extends Model
{
    protected $table = 'movimientos_caja';
    protected $primaryKey = 'id_movimiento';
    public $timestamps = true;

    protected $fillable = [
        'id_empresa',
        'id_usuario',
        'id_cierre',
        'codvb6',
        'fecha',
        'hora',
        'tipo',
        'concepto',
        'categoria',
        'monto',
        'saldo_anterior',
        'saldo_nuevo',
        'referencia',
        'observaciones',
        'anulado',
        'anulado_por',
        'fecha_anulacion'
    ];

    protected $casts = [
        'fecha' => 'date',
        'monto' => 'decimal:4',
        'saldo_anterior' => 'decimal:4',
        'saldo_nuevo' => 'decimal:4',
        'anulado' => 'boolean',
        'fecha_anulacion' => 'datetime'
    ];

    /**
     * Relación con empresa
     */
    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }

    /**
     * Relación con usuario
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Relación con cierre de caja
     */
    public function cierre()
    {
        return $this->belongsTo(CierreCaja::class, 'id_cierre', 'id_cierre');
    }

    /**
     * Relación con usuario que anuló
     */
    public function anulador()
    {
        return $this->belongsTo(Usuario::class, 'anulado_por', 'id_usuario');
    }

    /**
     * Scope para filtrar por empresa
     */
    public function scopeDeEmpresa($query, $idEmpresa)
    {
        return $query->where('id_empresa', $idEmpresa);
    }

    /**
     * Scope para entradas
     */
    public function scopeEntradas($query)
    {
        return $query->where('tipo', 'entrada');
    }

    /**
     * Scope para salidas
     */
    public function scopeSalidas($query)
    {
        return $query->where('tipo', 'salida');
    }

    /**
     * Scope para no anulados
     */
    public function scopeActivos($query)
    {
        return $query->where('anulado', false);
    }
}
