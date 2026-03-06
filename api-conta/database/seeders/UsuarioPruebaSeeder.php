<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;

class UsuarioPruebaSeeder extends Seeder
{
    public function run()
    {
        // Verificar si ya existe
        $existe = Usuario::where('email_us', 'admin@conta.com')->first();

        if (!$existe) {
            Usuario::create([
                'nombre_us' => 'Administrador',
                'email_us' => 'admin@conta.com',
                'password_us' => Hash::make('123456'),
                'id_tipo_usuario' => 1, // Administrador
                'tipologin' => 'r',
                'email_validado' => 'S',
                'estado_us' => 1
            ]);

            echo "Usuario de prueba creado:\n";
            echo "Email: admin@conta.com\n";
            echo "Password: 123456\n";
        } else {
            echo "El usuario ya existe\n";
        }
    }
}
