<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoOrganizacion extends Model
{
    protected $table = 'type_organizations';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'code',
        'name',
        'description'
    ];

    /**
     * Relación con clientes (tipo de adquiriente)
     */
    public function clientes()
    {
        return $this->hasMany(Cliente::class, 'tipo_adquiriente', 'code');
    }
}
