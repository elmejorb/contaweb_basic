<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    protected $table = 'ventas';
    protected $primaryKey = 'id_venta';
    public $timestamps = true;

    protected $fillable = [
        'id_empresa',
        'id_cliente',
        'id_usuario',
        'id_estado',
        'id_tipo_documento',
        'codvb6',
        'numero_factura',
        'fecha_venta',
        'subtotal',
        'total_impuestos',
        'descuento',
        'total',
        'forma_pago',
        'observaciones',
        'sincronizado',
        't_utilidad_vent',
        // Campos de factura electrónica
        'es_electronica',
        'prefijo_fe',
        'numero_fe',
        'cufe',
        'qr_code',
        'estado_fe',
        'fecha_envio_dian',
        'fecha_respuesta_dian',
        'respuesta_dian',
        'editable'
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'total_impuestos' => 'decimal:2',
        'descuento' => 'decimal:2',
        'total' => 'decimal:2',
        't_utilidad_vent' => 'decimal:2',
        'fecha_venta' => 'date',
        'es_electronica' => 'boolean',
        'editable' => 'boolean',
        'fecha_envio_dian' => 'datetime',
        'fecha_respuesta_dian' => 'datetime'
    ];

    /**
     * Relación con empresa
     */
    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }

    /**
     * Relación con cliente
     */
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente', 'id_cliente');
    }

    /**
     * Relación con usuario
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Relación con estado
     */
    public function estado()
    {
        return $this->belongsTo(EstadoFactura::class, 'id_estado', 'id_estado');
    }

    /**
     * Relación con tipo de documento
     */
    public function tipoDocumento()
    {
        return $this->belongsTo(TipoDocumentoFacturacion::class, 'id_tipo_documento', 'id_tipo_documento');
    }

    /**
     * Relación con detalles de venta
     */
    public function detalles()
    {
        return $this->hasMany(VentaDetalle::class, 'id_venta', 'id_venta');
    }

    /**
     * Verificar si la venta es editable
     */
    public function esEditable()
    {
        // No es editable si ya fue sincronizada desde VB6 o es factura electrónica aceptada
        if (!$this->editable) {
            return false;
        }

        if ($this->es_electronica && in_array($this->estado_fe, ['aceptada', 'enviada'])) {
            return false;
        }

        return true;
    }

    /**
     * Verificar si proviene de VB6
     */
    public function esDeVB6()
    {
        return !empty($this->codvb6);
    }

    /**
     * Obtener el número completo de factura electrónica
     */
    public function getNumeroFacturaElectronica()
    {
        if (!$this->es_electronica) {
            return null;
        }

        return ($this->prefijo_fe ?? '') . $this->numero_fe;
    }
}
