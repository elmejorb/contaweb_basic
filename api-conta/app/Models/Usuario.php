<?php

namespace App\Models;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Lumen\Auth\Authorizable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class Usuario extends Model implements AuthenticatableContract, AuthorizableContract, JWTSubject
{
    use Authenticatable, Authorizable, HasFactory;

    protected $table = 'usuarios';
    protected $primaryKey = 'id_usuario';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'nombre_us',
        'email_us',
        'password_us',
        'avatar',
        'id_tipo_usuario',
        'tipologin',
        'uid',
        'token_us',
        'email_validado',
        'email_token',
        'estado_us',
        'cambio_password',
        'password_reset_token',
        'password_reset_expires_at'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
        'password_us',
        'email_token',
        'token_us',
        'password_reset_token'
    ];

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [];
    }

    /**
     * Get the password for the user.
     *
     * @return string
     */
    public function getAuthPassword()
    {
        return $this->password_us;
    }

    /**
     * Relación con tipo de usuario
     */
    public function tipoUsuario()
    {
        return $this->belongsTo(TipoUsuario::class, 'id_tipo_usuario', 'id_tipo_usuario');
    }

    /**
     * Relación muchos a muchos con empresas
     */
    public function empresas()
    {
        return $this->belongsToMany(
            Empresa::class,
            'usuarios_empresas',
            'id_usuario',
            'id_empresa'
        );
    }

    /**
     * Obtener la empresa principal del usuario
     */
    public function empresaPrincipal()
    {
        return $this->empresas()->orderBy('usuarios_empresas.created_at', 'asc')->first();
    }
}
