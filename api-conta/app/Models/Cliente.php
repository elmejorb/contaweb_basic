<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $table = 'clientes';
    protected $primaryKey = 'id_cliente';

    protected $fillable = [
        'id_empresa',
        'codvb6',
        'codigo_cliente',
        'nombre_razon_social',
        'tipo_documento',
        'numero_documento',
        'digito_verificacion',
        'telefono',
        'celular',
        'whatsapp',
        'email',
        'direccion',
        'departamento',
        'municipio',
        'fecha_nacimiento',
        'tipo_responsabilidad',
        'tipo_adquiriente',
        'regimen_tributario',
        'contacto_nombres',
        'contacto_apellidos',
        'contacto_telefono',
        'contacto_direccion',
        'cupo_autorizado',
        'id_vendedor',
        'factura_precio_costo',
        'facturar_con_vencimientos',
        'facturar_solo_contado',
        'estado'
    ];

    protected $casts = [
        'cupo_autorizado' => 'decimal:2',
        'factura_precio_costo' => 'boolean',
        'facturar_con_vencimientos' => 'boolean',
        'facturar_solo_contado' => 'boolean',
        'estado' => 'boolean',
        'fecha_nacimiento' => 'date'
    ];

    // Relaciones
    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }

    public function vendedor()
    {
        return $this->belongsTo(Usuario::class, 'id_vendedor', 'id_usuario');
    }

    public function tipoDocumentoRelacion()
    {
        return $this->belongsTo(TipoDocumento::class, 'tipo_documento', 'code');
    }

    public function tipoResponsabilidadRelacion()
    {
        return $this->belongsTo(TipoResponsabilidad::class, 'tipo_responsabilidad', 'code');
    }

    public function tipoAdquirienteRelacion()
    {
        return $this->belongsTo(TipoOrganizacion::class, 'tipo_adquiriente', 'code');
    }

    public function regimenTributarioRelacion()
    {
        return $this->belongsTo(TipoRegimen::class, 'regimen_tributario', 'code');
    }
}
