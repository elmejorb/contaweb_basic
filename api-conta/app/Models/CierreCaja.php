<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CierreCaja extends Model
{
    protected $table = 'cierres_caja';
    protected $primaryKey = 'id_cierre';
    public $timestamps = true;

    protected $fillable = [
        'id_empresa',
        'id_usuario',
        'codvb6',
        'fecha',
        'fecha_cierre',
        'base_inicial',
        'base_siguiente',
        'arqueo_billetes',
        'arqueo_monedas',
        'arqueo_cheques',
        'arqueo_total',
        'saldo_libros',
        'diferencia',
        'ventas_contado',
        'ventas_credito',
        'ventas_tarjeta',
        'ventas_transferencia',
        'ventas_nequi',
        'pagos_clientes',
        'otros_ingresos',
        'egresos',
        'devoluciones_ventas',
        'devoluciones_compras',
        'pagos_proveedores',
        'separados',
        'total_efectivo',
        'total_venta_dia',
        'valor_inventario',
        'estado',
        'aprobado_por',
        'fecha_aprobacion',
        'observaciones'
    ];

    protected $casts = [
        'fecha' => 'date',
        'fecha_cierre' => 'datetime',
        'fecha_aprobacion' => 'datetime',
        'base_inicial' => 'decimal:4',
        'base_siguiente' => 'decimal:4',
        'arqueo_billetes' => 'decimal:4',
        'arqueo_monedas' => 'decimal:4',
        'arqueo_cheques' => 'decimal:4',
        'arqueo_total' => 'decimal:4',
        'saldo_libros' => 'decimal:4',
        'diferencia' => 'decimal:4',
        'ventas_contado' => 'decimal:4',
        'ventas_credito' => 'decimal:4',
        'ventas_tarjeta' => 'decimal:4',
        'ventas_transferencia' => 'decimal:4',
        'ventas_nequi' => 'decimal:4',
        'pagos_clientes' => 'decimal:4',
        'otros_ingresos' => 'decimal:4',
        'egresos' => 'decimal:4',
        'devoluciones_ventas' => 'decimal:4',
        'devoluciones_compras' => 'decimal:4',
        'pagos_proveedores' => 'decimal:4',
        'separados' => 'decimal:4',
        'total_efectivo' => 'decimal:4',
        'total_venta_dia' => 'decimal:4',
        'valor_inventario' => 'decimal:4',
        'estado' => 'integer'
    ];

    /**
     * Relación con empresa
     */
    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }

    /**
     * Relación con usuario/vendedor
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Relación con usuario que aprobó
     */
    public function aprobador()
    {
        return $this->belongsTo(Usuario::class, 'aprobado_por', 'id_usuario');
    }

    /**
     * Scope para filtrar por empresa
     */
    public function scopeDeEmpresa($query, $idEmpresa)
    {
        return $query->where('id_empresa', $idEmpresa);
    }

    /**
     * Scope para filtrar por usuario/vendedor
     */
    public function scopeDeUsuario($query, $idUsuario)
    {
        return $query->where('id_usuario', $idUsuario);
    }

    /**
     * Scope para filtrar por fecha
     */
    public function scopeDeFecha($query, $fecha)
    {
        return $query->whereDate('fecha', $fecha);
    }

    /**
     * Scope para cierres abiertos
     */
    public function scopeAbiertos($query)
    {
        return $query->where('estado', 0);
    }

    /**
     * Scope para cierres cerrados
     */
    public function scopeCerrados($query)
    {
        return $query->where('estado', 1);
    }

    /**
     * Scope para cierres aprobados
     */
    public function scopeAprobados($query)
    {
        return $query->where('estado', 2);
    }

    /**
     * Obtener el nombre del estado
     */
    public function getEstadoNombreAttribute()
    {
        $estados = [
            -1 => 'Anulado',
            0 => 'Abierto',
            1 => 'Cerrado',
            2 => 'Aprobado'
        ];
        return $estados[$this->estado] ?? 'Desconocido';
    }

    /**
     * Verificar si el cierre puede ser editado
     */
    public function esEditable()
    {
        return $this->estado == 0; // Solo si está abierto
    }

    /**
     * Calcular total de ingresos
     */
    public function getTotalIngresosAttribute()
    {
        return $this->ventas_contado
             + $this->ventas_credito
             + $this->ventas_tarjeta
             + $this->ventas_transferencia
             + $this->ventas_nequi
             + $this->pagos_clientes
             + $this->otros_ingresos;
    }

    /**
     * Calcular total de egresos
     */
    public function getTotalEgresosAttribute()
    {
        return $this->egresos
             + $this->devoluciones_ventas
             + $this->pagos_proveedores;
    }
}
