<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoResponsabilidad extends Model
{
    protected $table = 'type_liabilities';
    protected $primaryKey = 'id';
    public $timestamps = false;

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
        return $this->hasMany(Cliente::class, 'tipo_responsabilidad', 'code');
    }
}
