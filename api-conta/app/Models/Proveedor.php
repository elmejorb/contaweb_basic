<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    protected $table = 'proveedores';
    protected $primaryKey = 'id_proveedor';
    public $timestamps = true;

    protected $fillable = [
        'id_empresa',
        'codvb6',
        'codigo_proveedor',
        'razon_social',
        'nit',
        'telefono',
        'email',
        'direccion',
        'contacto_nombres',
        'contacto_apellidos',
        'contacto_identificacion',
        'contacto_telefono',
        'contacto_direccion',
        'numero_cuentas_banco',
        'estado'
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    /**
     * Relación con empresa
     */
    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }
}
