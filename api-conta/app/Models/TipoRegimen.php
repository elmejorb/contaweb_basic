<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoRegimen extends Model
{
    protected $table = 'type_regimes';
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
        return $this->hasMany(Cliente::class, 'regimen_tributario', 'code');
    }
}
