<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SyncElectronController extends Controller
{
    /**
     * Validar credenciales de sincronizacion desde Electron
     * POST /sync/electron/validar
     * Body JSON: { "email": "...", "token_api": "..." }
     */
    public function validar(Request $request)
    {
        try {
            // Log de la peticion recibida
            \Log::info('SYNC_ELECTRON_VALIDAR', [
                'ip' => $request->ip(),
                'content_type' => $request->header('Content-Type'),
                'user_agent' => $request->header('User-Agent'),
                'email' => $request->input('email'),
                'token_length' => strlen($request->input('token_api', '')),
                'token_first10' => substr($request->input('token_api', ''), 0, 10),
                'method' => $request->method(),
                'all_keys' => array_keys($request->all()),
            ]);

            $email = trim($request->input('email', ''));
            $tokenApi = trim($request->input('token_api', ''));

            if (empty($email) || empty($tokenApi)) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Email y token_api son requeridos',
                    'debug' => [
                        'email_empty' => empty($email),
                        'token_empty' => empty($tokenApi),
                        'content_type' => $request->header('Content-Type'),
                    ]
                ], 422);
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'El email no es valido'
                ], 422);
            }

            // Buscar usuario por email
            $usuario = Usuario::where('email_us', $email)->first();

            if (!$usuario) {
                \Log::warning('SYNC_ELECTRON_USER_NOT_FOUND', ['email' => $email]);
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Usuario no encontrado'
                ], 401);
            }

            // Buscar empresa por token_api
            $empresa = Empresa::where('token_api', $tokenApi)->first();

            if (!$empresa) {
                \Log::warning('SYNC_ELECTRON_EMPRESA_NOT_FOUND', [
                    'token_first10' => substr($tokenApi, 0, 10),
                    'token_length' => strlen($tokenApi)
                ]);
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Token de empresa no valido'
                ], 401);
            }

            // Verificar que el usuario tenga acceso a la empresa
            $tieneAcceso = DB::table('usuarios_empresas')
                ->where('id_usuario', $usuario->id_usuario)
                ->where('id_empresa', $empresa->id_empresa)
                ->exists();

            if (!$tieneAcceso) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'El usuario no tiene acceso a esta empresa'
                ], 403);
            }

            \Log::info('SYNC_ELECTRON_VALIDAR_OK', [
                'email' => $email,
                'empresa' => $empresa->nombre_empresa
            ]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Credenciales validas',
                'empresa' => [
                    'id_empresa' => $empresa->id_empresa,
                    'codigo_empresa' => $empresa->codigo_empresa,
                    'nombre_empresa' => $empresa->nombre_empresa,
                    'nit_empresa' => $empresa->nit_empresa
                ],
                'usuario' => [
                    'id_usuario' => $usuario->id_usuario,
                    'nombre' => $usuario->nombre_us,
                    'email' => $usuario->email_us
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('SYNC_ELECTRON_VALIDAR_ERROR', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => true,
                'mensaje' => 'Error interno: ' . $e->getMessage()
            ], 500);
        }
    }
}
