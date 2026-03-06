<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Impuesto extends Model
{
    protected $table = 'impuestos';
    protected $primaryKey = 'id_impuesto';

    protected $fillable = [
        'nombre_impuesto',
        'porcentaje',
        'estado'
    ];

    protected $casts = [
        'porcentaje' => 'decimal:2',
        'estado' => 'boolean',
    ];

    /**
     * Scope para obtener solo impuestos activos
     */
    public function scopeActivos($query)
    {
        return $query->where('estado', 1);
    }
}
