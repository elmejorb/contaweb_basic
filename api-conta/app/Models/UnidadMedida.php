<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UnidadMedida extends Model
{
    protected $table = 'unit_measures';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'name',
        'code'
    ];

    /**
     * Buscar por código
     */
    public function scopePorCodigo($query, $codigo)
    {
        return $query->where('code', $codigo);
    }

    /**
     * Buscar por nombre
     */
    public function scopePorNombre($query, $nombre)
    {
        return $query->where('name', 'like', '%' . $nombre . '%');
    }
}
