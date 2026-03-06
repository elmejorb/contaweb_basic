<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsecutivoFacturacion extends Model
{
    protected $table = 'consecutivos_facturacion';
    protected $primaryKey = 'id_consecutivo';
    public $timestamps = true;

    protected $fillable = [
        'id_empresa',
        'id_tipo_documento',
        'prefijo',
        'numero_inicial',
        'numero_actual',
        'numero_final',
        'fecha_autorizacion',
        'fecha_vencimiento',
        'resolucion_dian',
        'estado'
    ];

    protected $casts = [
        'numero_inicial' => 'integer',
        'numero_actual' => 'integer',
        'numero_final' => 'integer',
        'fecha_autorizacion' => 'date',
        'fecha_vencimiento' => 'date',
        'estado' => 'boolean'
    ];

    /**
     * Relación con empresa
     */
    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }

    /**
     * Relación con tipo de documento
     */
    public function tipoDocumento()
    {
        return $this->belongsTo(TipoDocumentoFacturacion::class, 'id_tipo_documento', 'id_tipo_documento');
    }

    /**
     * Obtener el siguiente número de consecutivo
     */
    public function obtenerSiguiente()
    {
        $siguiente = $this->numero_actual + 1;

        // Verificar si hay límite y si se excedió
        if ($this->numero_final && $siguiente > $this->numero_final) {
            return null; // Rango agotado
        }

        return $siguiente;
    }

    /**
     * Incrementar el consecutivo
     */
    public function incrementar()
    {
        $siguiente = $this->obtenerSiguiente();

        if ($siguiente === null) {
            return false; // Rango agotado
        }

        $this->numero_actual = $siguiente;
        $this->save();

        return $siguiente;
    }

    /**
     * Obtener el número formateado con prefijo
     */
    public function obtenerNumeroFormateado($numero = null)
    {
        $num = $numero ?? $this->numero_actual;
        $prefijo = $this->prefijo ?? '';

        return $prefijo . str_pad($num, 8, '0', STR_PAD_LEFT);
    }

    /**
     * Verificar si el rango está vigente (para FE)
     */
    public function estaVigente()
    {
        if (!$this->fecha_vencimiento) {
            return true;
        }

        return now()->lte($this->fecha_vencimiento);
    }

    /**
     * Verificar si el rango tiene números disponibles
     */
    public function tieneDisponibles()
    {
        if (!$this->numero_final) {
            return true; // Sin límite
        }

        return $this->numero_actual < $this->numero_final;
    }
}
