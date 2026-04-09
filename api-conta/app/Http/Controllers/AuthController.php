<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;
use Carbon\Carbon;
use App\Services\SmtpMailService;

class AuthController extends Controller
{
    /**
     * Login de usuario
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Datos inválidos',
                'errores' => $validator->errors()
            ], 400);
        }

        // Buscar usuario por email
        $usuario = Usuario::where('email_us', $request->email)->first();

        if (!$usuario) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Usuario o contraseña no válidos'
            ], 401);
        }

        // Verificar contraseña
        if (!Hash::check($request->password, $usuario->password_us)) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Usuario o contraseña no válidos'
            ], 401);
        }

        // Verificar si el email está validado
        if ($usuario->email_validado !== 'S') {
            return response()->json([
                'error' => true,
                'mensaje' => 'Debe validar su correo electrónico antes de iniciar sesión'
            ], 403);
        }

        // Verificar si el usuario está activo
        if ($usuario->estado_us !== 1) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Usuario inactivo. Contacte al administrador'
            ], 403);
        }

        // Si no tiene empresa, crear una de prueba
        if ($usuario->empresas()->count() === 0) {
            $this->crearEmpresaPrueba($usuario->id_usuario);
        }

        // Generar token JWT
        $token = JWTAuth::fromUser($usuario);

        // Obtener empresa principal
        $empresa = $usuario->empresaPrincipal();

        // Actualizar token de sesión
        $usuario->token_us = $token;
        $usuario->save();

        // Registrar sesión
        \DB::table('sessiones_usuario')->insert([
            'id_usuarios' => $usuario->id_usuario,
            'fecha_hora_ses' => Carbon::now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now()
        ]);

        // Cargar relación con tipo de usuario
        $usuario->load('tipoUsuario');

        return response()->json([
            'error' => false,
            'mensaje' => 'Login exitoso',
            'token' => $token,
            'usuario' => [
                'id_usuario' => $usuario->id_usuario,
                'nombre_us' => $usuario->nombre_us,
                'email_us' => $usuario->email_us,
                'avatar' => $usuario->avatar,
                'tipo_usuario' => $usuario->tipoUsuario->nombre_tipo ?? 'Usuario',
                'id_empresa' => $empresa->id_empresa ?? null,
                'nombre_empresa' => $empresa->nombre_empresa ?? null
            ]
        ]);
    }

    /**
     * Registro de nuevo usuario
     */
    public function registro(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token_crm' => 'required|string',
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'email' => 'required|email|unique:usuarios,email_us',
            'password' => 'required|string|min:6',
            'password_confirmation' => 'required|string|same:password'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Datos inválidos',
                'errores' => $validator->errors()
            ], 400);
        }

        // Validar token CRM
        $crmService = new \App\Services\CRMValidationService();
        $validacion = $crmService->validarToken($request->token_crm);

        if (!$validacion['valido']) {
            return response()->json([
                'error' => true,
                'mensaje' => $validacion['mensaje'] ?? 'Token CRM inválido'
            ], 400);
        }

        // Generar token de validación de email
        $emailToken = hash('sha256', $request->email . time());

        // Concatenar nombres y apellidos
        $nombreCompleto = trim($request->nombres . ' ' . $request->apellidos);

        // Crear usuario
        $usuario = Usuario::create([
            'nombre_us' => $nombreCompleto,
            'email_us' => $request->email,
            'password_us' => Hash::make($request->password),
            'id_tipo_usuario' => 2, // Usuario normal
            'tipologin' => 'r', // Registro
            'email_validado' => 'S', // Activar automáticamente para pruebas
            'email_token' => $emailToken,
            'estado_us' => 1 // Activo para poder hacer login inmediatamente
        ]);

        // Crear empresa con datos del CRM
        $datosCliente = $validacion['cliente'];
        $datosSuscripcion = $validacion['suscripcion'];

        $empresa = \App\Models\Empresa::create([
            'nombre_empresa' => $datosCliente['empresa'],
            'nit_empresa' => $datosCliente['nit'] ?? '0',
            'telefono_empresa' => $datosCliente['telefono'] ?? null,
            'email_empresa' => $datosCliente['email'] ?? $request->email,
            'token_crm' => $request->token_crm,
            'id_cliente_crm' => $datosCliente['id'],
            'plan_actual' => $datosSuscripcion['plan'],
            'fecha_vencimiento_plan' => $datosSuscripcion['fecha_vencimiento'],
            'estado_suscripcion' => $datosSuscripcion['estado'],
            'modulos_habilitados' => $crmService->obtenerModulosPorPlan($datosSuscripcion['plan']),
            'ultima_validacion_crm' => Carbon::now()
        ]);

        // Asociar usuario con empresa
        \DB::table('usuarios_empresas')->insert([
            'id_usuario' => $usuario->id_usuario,
            'id_empresa' => $empresa->id_empresa,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now()
        ]);

        // TODO: Enviar email de validación
        // $this->enviarEmailValidacion($usuario->email_us, $usuario->nombre_us, $emailToken);

        return response()->json([
            'error' => false,
            'mensaje' => 'Usuario y empresa registrados exitosamente. Ya puedes iniciar sesión.',
            'id_usuario' => $usuario->id_usuario,
            'id_empresa' => $empresa->id_empresa,
            'empresa' => [
                'nombre' => $empresa->nombre_empresa,
                'nit' => $empresa->nit_empresa,
                'plan' => $empresa->plan_actual
            ]
        ], 201);
    }

    /**
     * Obtener información del usuario autenticado
     */
    public function me()
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            if (!$usuario) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Usuario no encontrado'
                ], 404);
            }

            $usuario->load('tipoUsuario');
            $empresa = $usuario->empresaPrincipal();

            return response()->json([
                'error' => false,
                'usuario' => [
                    'id_usuario' => $usuario->id_usuario,
                    'nombre_us' => $usuario->nombre_us,
                    'email_us' => $usuario->email_us,
                    'avatar' => $usuario->avatar,
                    'tipo_usuario' => $usuario->tipoUsuario->nombre_tipo ?? 'Usuario',
                    'id_empresa' => $empresa->id_empresa ?? null,
                    'nombre_empresa' => $empresa->nombre_empresa ?? null
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Token inválido'
            ], 401);
        }
    }

    /**
     * Logout
     */
    public function logout()
    {
        try {
            JWTAuth::parseToken()->invalidate();

            return response()->json([
                'error' => false,
                'mensaje' => 'Sesión cerrada exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cerrar sesión'
            ], 500);
        }
    }

    /**
     * Refrescar token
     */
    public function refresh()
    {
        try {
            $newToken = JWTAuth::parseToken()->refresh();

            return response()->json([
                'error' => false,
                'token' => $newToken
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'No se pudo refrescar el token'
            ], 401);
        }
    }

    /**
     * Crear empresa de prueba para el usuario
     */
    private function crearEmpresaPrueba($idUsuario)
    {
        $empresa = Empresa::create([
            'nombre_empresa' => 'Empresa de Prueba',
            'nit_empresa' => '0',
            'telefono_empresa' => '-',
            'direccion_empresa' => '-'
        ]);

        \DB::table('usuarios_empresas')->insert([
            'id_usuario' => $idUsuario,
            'id_empresa' => $empresa->id_empresa,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now()
        ]);

        return $empresa;
    }

    /**
     * Actualizar perfil del usuario
     */
    public function actualizarPerfil(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            if (!$usuario) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Usuario no encontrado'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nombre_us' => 'required|string|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 400);
            }

            $usuario->nombre_us = $request->nombre_us;
            $usuario->save();

            return response()->json([
                'error' => false,
                'mensaje' => 'Perfil actualizado exitosamente',
                'usuario' => [
                    'id_usuario' => $usuario->id_usuario,
                    'nombre_us' => $usuario->nombre_us,
                    'email_us' => $usuario->email_us,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar perfil'
            ], 500);
        }
    }

    /**
     * Actualizar email (requiere validación)
     */
    public function actualizarEmail(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            if (!$usuario) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Usuario no encontrado'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'email_nuevo' => 'required|email|unique:usuarios,email_us',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Email inválido o ya está en uso',
                    'errores' => $validator->errors()
                ], 400);
            }

            // Generar token de validación
            $emailToken = hash('sha256', $request->email_nuevo . time());

            $usuario->email_us = $request->email_nuevo;
            $usuario->email_validado = 'N';
            $usuario->email_token = $emailToken;
            $usuario->save();

            // TODO: Enviar email de validación
            // $this->enviarEmailValidacion($usuario->email_us, $usuario->nombre_us, $emailToken);

            return response()->json([
                'error' => false,
                'mensaje' => 'Email actualizado. Por favor revisa tu correo para verificarlo.',
                'requiere_validacion' => true
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar email'
            ], 500);
        }
    }

    /**
     * Cambiar contraseña
     */
    public function cambiarPassword(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            if (!$usuario) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Usuario no encontrado'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'password_actual' => 'required|string',
                'password_nuevo' => 'required|string|min:6|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 400);
            }

            // Verificar contraseña actual
            if (!Hash::check($request->password_actual, $usuario->password_us)) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'La contraseña actual es incorrecta'
                ], 400);
            }

            // Actualizar contraseña
            $usuario->password_us = Hash::make($request->password_nuevo);
            $usuario->save();

            return response()->json([
                'error' => false,
                'mensaje' => 'Contraseña actualizada exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar contraseña'
            ], 500);
        }
    }

    /**
     * Solicitar recuperación de contraseña
     */
    public function solicitarResetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Ingrese un correo electrónico válido'
            ], 400);
        }

        $usuario = Usuario::where('email_us', $request->email)->first();

        // Siempre responder con éxito para no revelar si el email existe
        if (!$usuario) {
            return response()->json([
                'error' => false,
                'mensaje' => 'Si el correo está registrado, recibirás un código de recuperación.'
            ]);
        }

        // Generar código de 6 dígitos
        $codigo = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Almacenar código hasheado con bcrypt para verificación segura
        $usuario->password_reset_token = Hash::make($codigo);
        $usuario->password_reset_expires_at = Carbon::now()->addMinutes(30);
        $usuario->save();

        // Enviar email con el código
        $this->enviarEmailRecuperacion($usuario->email_us, $usuario->nombre_us, $codigo);

        return response()->json([
            'error' => false,
            'mensaje' => 'Si el correo está registrado, recibirás un código de recuperación.'
        ]);
    }

    /**
     * Restablecer contraseña con código
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'codigo' => 'required|string|size:6',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Datos inválidos',
                'errores' => $validator->errors()
            ], 400);
        }

        $usuario = Usuario::where('email_us', $request->email)->first();

        if (!$usuario || !$usuario->password_reset_token || !$usuario->password_reset_expires_at) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Solicitud de recuperación no válida. Solicita un nuevo código.'
            ], 400);
        }

        // Verificar expiración
        if (Carbon::now()->gt(Carbon::parse($usuario->password_reset_expires_at))) {
            $usuario->password_reset_token = null;
            $usuario->password_reset_expires_at = null;
            $usuario->save();

            return response()->json([
                'error' => true,
                'mensaje' => 'El código ha expirado. Solicita uno nuevo.'
            ], 400);
        }

        // Verificar código con bcrypt
        if (!Hash::check($request->codigo, $usuario->password_reset_token)) {
            return response()->json([
                'error' => true,
                'mensaje' => 'El código de verificación no es válido.'
            ], 400);
        }

        // Actualizar contraseña
        $usuario->password_us = Hash::make($request->password);
        $usuario->password_reset_token = null;
        $usuario->password_reset_expires_at = null;
        $usuario->save();

        return response()->json([
            'error' => false,
            'mensaje' => 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.'
        ]);
    }

    /**
     * Enviar email de recuperación de contraseña vía SMTP
     */
    private function enviarEmailRecuperacion($email, $nombre, $codigo)
    {
        $htmlBody = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #7c3aed; margin: 0; font-size: 24px; }
                .code-box { background: #f3f0ff; border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #7c3aed; }
                .info { color: #666; font-size: 14px; line-height: 1.5; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>ContaRs Pro</h1>
                </div>
                <p>Hola <strong>{$nombre}</strong>,</p>
                <p class='info'>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código:</p>
                <div class='code-box'>
                    <div class='code'>{$codigo}</div>
                </div>
                <p class='info'>Este código expira en <strong>30 minutos</strong>.</p>
                <p class='info'>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
                <div class='footer'>
                    <p>&copy; ContaRs Pro - Este es un mensaje automático, no respondas a este correo.</p>
                </div>
            </div>
        </body>
        </html>";

        $textBody = "Hola {$nombre}, tu código de recuperación es: {$codigo}. Expira en 30 minutos.";

        $mailer = new SmtpMailService();
        $mailer->send($email, $nombre, 'Código de recuperación - ContaRs Pro', $htmlBody, $textBody);
    }

    /**
     * Subir foto de perfil
     */
    public function subirFotoPerfil(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            if (!$usuario) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Usuario no encontrado'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'foto' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // Máximo 5MB
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Imagen inválida',
                    'errores' => $validator->errors()
                ], 400);
            }

            // Eliminar foto anterior si existe
            if ($usuario->avatar && file_exists(base_path('public' . $usuario->avatar))) {
                unlink(base_path('public' . $usuario->avatar));
            }

            // Subir nueva foto
            $file = $request->file('foto');
            $nombreArchivo = 'avatar_' . $usuario->id_usuario . '_' . time() . '.' . $file->getClientOriginalExtension();
            $rutaDestino = base_path('public/uploads/avatars');

            // Crear directorio si no existe
            if (!file_exists($rutaDestino)) {
                mkdir($rutaDestino, 0755, true);
            }

            $file->move($rutaDestino, $nombreArchivo);

            // Actualizar usuario
            $usuario->avatar = '/uploads/avatars/' . $nombreArchivo;
            $usuario->save();

            return response()->json([
                'error' => false,
                'mensaje' => 'Foto de perfil actualizada exitosamente',
                'avatar' => $usuario->avatar
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al subir foto de perfil: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar foto de perfil
     */
    public function eliminarFotoPerfil(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            if (!$usuario) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Usuario no encontrado'
                ], 404);
            }

            // Eliminar foto si existe
            if ($usuario->avatar && file_exists(base_path('public' . $usuario->avatar))) {
                unlink(base_path('public' . $usuario->avatar));
            }

            // Actualizar usuario
            $usuario->avatar = null;
            $usuario->save();

            return response()->json([
                'error' => false,
                'mensaje' => 'Foto de perfil eliminada exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al eliminar foto de perfil'
            ], 500);
        }
    }
}
