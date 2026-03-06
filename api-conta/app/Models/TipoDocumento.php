<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoDocumento extends Model
{
    protected $table = 'tipos_documentos';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'code',
        'name',
        'description'
    ];

    /**
     * Relación con clientes
     */
    public function clientes()
    {
        return $this->hasMany(Cliente::class, 'tipo_documento', 'code');
    }
}
