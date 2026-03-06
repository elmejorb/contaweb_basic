<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoDocumentoFacturacion extends Model
{
    protected $table = 'tipos_documento_facturacion';
    protected $primaryKey = 'id_tipo_documento';
    public $timestamps = true;

    protected $fillable = [
        'codigo',
        'nombre',
        'descripcion',
        'es_electronica',
        'es_sincronizable',
        'es_editable',
        'requiere_consecutivo_propio',
        'prefijo_defecto',
        'estado'
    ];

    protected $casts = [
        'es_electronica' => 'boolean',
        'es_sincronizable' => 'boolean',
        'es_editable' => 'boolean',
        'requiere_consecutivo_propio' => 'boolean',
        'estado' => 'boolean'
    ];

    /**
     * Relación con consecutivos
     */
    public function consecutivos()
    {
        return $this->hasMany(ConsecutivoFacturacion::class, 'id_tipo_documento', 'id_tipo_documento');
    }

    /**
     * Relación con ventas
     */
    public function ventas()
    {
        return $this->hasMany(Venta::class, 'id_tipo_documento', 'id_tipo_documento');
    }
}
