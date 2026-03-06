<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoUsuario extends Model
{
    protected $table = 'tipos_usuario';
    protected $primaryKey = 'id_tipo_usuario';

    protected $fillable = [
        'nombre_tipo'
    ];

    public function usuarios()
    {
        return $this->hasMany(Usuario::class, 'id_tipo_usuario', 'id_tipo_usuario');
    }
}
