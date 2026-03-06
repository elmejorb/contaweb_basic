<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Empresa extends Model
{
    protected $table = 'empresas';
    protected $primaryKey = 'id_empresa';

    protected $fillable = [
        'nombre_empresa',
        'nit_empresa',
        'telefono_empresa',
        'direccion_empresa',
        'email_empresa',
        'logo_empresa',
        'token_access',
        'codigo_empresa',
        'token_api',
        'descripcion_empresa',
        'regimen_empresa',
        'resolucion_facturacion',
        'fecha_resolucion',
        'prefijo_factura',
        'rango_desde',
        'rango_hasta',
        'token_crm',
        'id_cliente_crm',
        'plan_actual',
        'fecha_vencimiento_plan',
        'estado_suscripcion',
        'modulos_habilitados',
        'ultima_validacion_crm'
    ];

    protected $hidden = [
        'token_api' // Ocultar el token API en responses JSON por seguridad
        // token_crm se muestra porque se necesita en el frontend para sincronización
    ];

    protected $casts = [
        'modulos_habilitados' => 'array',
        'fecha_vencimiento_plan' => 'date',
        'ultima_validacion_crm' => 'datetime'
    ];

    /**
     * Accessor para asegurar que modulos_habilitados siempre sea un array
     */
    public function getModulosHabilitadosAttribute($value)
    {
        if (is_null($value)) {
            return [];
        }

        if (is_array($value)) {
            return $value;
        }

        // Si es string, decodificar JSON
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Mutator para asegurar que modulos_habilitados se guarde como JSON
     */
    public function setModulosHabilitadosAttribute($value)
    {
        if (is_null($value)) {
            $this->attributes['modulos_habilitados'] = null;
            return;
        }

        if (is_string($value)) {
            // Si ya es JSON válido, usarlo directamente
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $this->attributes['modulos_habilitados'] = $value;
                return;
            }
        }

        // Si es array, convertir a JSON
        $this->attributes['modulos_habilitados'] = json_encode($value);
    }

    public function usuarios()
    {
        return $this->belongsToMany(
            Usuario::class,
            'usuarios_empresas',
            'id_empresa',
            'id_usuario'
        );
    }
}
