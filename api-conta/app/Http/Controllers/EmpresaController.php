<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use App\Models\Usuario;
use App\Services\CRMValidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EmpresaController extends Controller
{
    /**
     * Listar empresas del usuario autenticado
     */
    public function misEmpresas(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Obtener empresas del usuario a través de la tabla pivote
            $empresas = $usuario->empresas()->get();

            return response()->json([
                'error' => false,
                'empresas' => $empresas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener empresas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener una empresa específica
     */
    public function obtener($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $id)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Empresa no encontrada o sin acceso'
                ], 404);
            }

            // Incluir token_api solo si el usuario solicita verlo explícitamente
            if (request()->get('show_token')) {
                $empresa->makeVisible('token_api');
            }

            return response()->json([
                'error' => false,
                'empresa' => $empresa
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener empresa: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear una nueva empresa
     */
    public function crear(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $validator = Validator::make($request->all(), [
                'nombre_empresa' => 'required|string|max:200',
                'nit_empresa' => 'required|string|max:50|unique:empresas,nit_empresa',
                'telefono_empresa' => 'nullable|string|max:50',
                'direccion_empresa' => 'nullable|string',
                'email_empresa' => 'nullable|email|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Crear empresa
                $empresa = Empresa::create([
                    'nombre_empresa' => $request->nombre_empresa,
                    'nit_empresa' => $request->nit_empresa,
                    'telefono_empresa' => $request->telefono_empresa,
                    'direccion_empresa' => $request->direccion_empresa,
                    'email_empresa' => $request->email_empresa
                ]);

                // Generar código y token
                $empresa->codigo_empresa = 'EMP' . str_pad($empresa->id_empresa, 4, '0', STR_PAD_LEFT);
                $empresa->token_api = bin2hex(random_bytes(32));
                $empresa->save();

                // Asociar usuario a la empresa (tabla pivote)
                DB::table('usuarios_empresas')->insert([
                    'id_usuario' => $usuario->id_usuario,
                    'id_empresa' => $empresa->id_empresa,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now()
                ]);

                DB::commit();

                return response()->json([
                    'error' => false,
                    'mensaje' => 'Empresa creada exitosamente',
                    'empresa' => $empresa
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear empresa: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar una empresa
     */
    public function actualizar(Request $request, $id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $id)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Empresa no encontrada o sin acceso'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nombre_empresa' => 'required|string|max:200',
                'nit_empresa' => 'required|string|max:50|unique:empresas,nit_empresa,' . $id . ',id_empresa',
                'telefono_empresa' => 'nullable|string|max:50',
                'direccion_empresa' => 'nullable|string',
                'email_empresa' => 'nullable|email|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 422);
            }

            $empresa->update([
                'nombre_empresa' => $request->nombre_empresa,
                'nit_empresa' => $request->nit_empresa,
                'telefono_empresa' => $request->telefono_empresa,
                'direccion_empresa' => $request->direccion_empresa,
                'email_empresa' => $request->email_empresa
            ]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Empresa actualizada exitosamente',
                'empresa' => $empresa
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar empresa: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Regenerar token API de una empresa
     */
    public function regenerarToken($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $id)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Empresa no encontrada o sin acceso'
                ], 404);
            }

            // Generar nuevo token
            $nuevoToken = bin2hex(random_bytes(32));
            $empresa->token_api = $nuevoToken;
            $empresa->save();

            return response()->json([
                'error' => false,
                'mensaje' => 'Token regenerado exitosamente',
                'token_api' => $nuevoToken
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al regenerar token: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener solo el token API de una empresa
     */
    public function obtenerToken($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $id)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Empresa no encontrada o sin acceso'
                ], 404);
            }

            return response()->json([
                'error' => false,
                'token_api' => $empresa->token_api,
                'codigo_empresa' => $empresa->codigo_empresa
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener token: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Subir logo de empresa
     */
    public function subirLogo(Request $request, $id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $id)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Empresa no encontrada o sin acceso'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Archivo inválido',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Eliminar logo anterior si existe
            if ($empresa->logo_empresa && file_exists(base_path('public' . $empresa->logo_empresa))) {
                unlink(base_path('public' . $empresa->logo_empresa));
            }

            // Guardar nuevo logo
            $file = $request->file('logo');
            $filename = 'empresa_' . $id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->move(base_path('public/uploads/empresas'), $filename);

            $logoPath = '/uploads/empresas/' . $filename;
            $empresa->logo_empresa = $logoPath;
            $empresa->save();

            return response()->json([
                'error' => false,
                'mensaje' => 'Logo actualizado exitosamente',
                'logo_url' => $logoPath
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al subir logo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar logo de empresa
     */
    public function eliminarLogo($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $id)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Empresa no encontrada o sin acceso'
                ], 404);
            }

            // Eliminar archivo si existe
            if ($empresa->logo_empresa && file_exists(base_path('public' . $empresa->logo_empresa))) {
                unlink(base_path('public' . $empresa->logo_empresa));
            }

            $empresa->logo_empresa = null;
            $empresa->save();

            return response()->json([
                'error' => false,
                'mensaje' => 'Logo eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al eliminar logo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validar credenciales de sincronización (email + token_api)
     * Endpoint público para validación desde software externo (VB6)
     */
    public function validarSincronizacion(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'token_api' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Buscar usuario por email_us
            $usuario = Usuario::where('email_us', $request->email)->first();

            if (!$usuario) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Credenciales inválidas'
                ], 401);
            }

            // Buscar empresa por token_api
            $empresa = Empresa::where('token_api', $request->token_api)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Credenciales inválidas'
                ], 401);
            }

            // Verificar que el usuario tenga acceso a esta empresa
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

            // Credenciales válidas - retornar información de la empresa
            return response()->json([
                'error' => false,
                'mensaje' => 'Credenciales válidas',
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
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al validar credenciales: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validar token del CRM antes de crear una empresa
     */
    public function validarTokenCRM(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'token_crm' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Token requerido',
                    'errores' => $validator->errors()
                ], 422);
            }

            $crmService = new CRMValidationService();
            $resultado = $crmService->validarToken($request->token_crm);

            if (!$resultado['valido']) {
                return response()->json([
                    'error' => true,
                    'mensaje' => $resultado['mensaje'] ?? 'Token inválido'
                ], 422);
            }

            // Verificar que la suscripción esté activa
            if (!$crmService->suscripcionActiva($resultado['suscripcion'])) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'La suscripción no está activa o ha vencido'
                ], 422);
            }

            // Verificar si ya existe una empresa con este token
            $empresaExistente = Empresa::where('token_crm', $request->token_crm)->first();
            if ($empresaExistente) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Este token ya está asociado a otra empresa'
                ], 422);
            }

            // Obtener módulos según el plan
            $modulos = $crmService->obtenerModulosPorPlan($resultado['suscripcion']['plan']);

            return response()->json([
                'error' => false,
                'mensaje' => 'Token válido',
                'cliente' => $resultado['cliente'],
                'suscripcion' => $resultado['suscripcion'],
                'modulos_habilitados' => $modulos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al validar token: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear empresa con validación de CRM
     */
    public function crearConCRM(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $validator = Validator::make($request->all(), [
                'token_crm' => 'required|string',
                'nombre_empresa' => 'required|string|max:200',
                'nit_empresa' => 'required|string|max:50|unique:empresas,nit_empresa',
                'telefono_empresa' => 'nullable|string|max:50',
                'direccion_empresa' => 'nullable|string',
                'email_empresa' => 'nullable|email|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Validar token con CRM
            $crmService = new CRMValidationService();
            $resultado = $crmService->validarToken($request->token_crm);

            if (!$resultado['valido']) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Token CRM inválido'
                ], 422);
            }

            if (!$crmService->suscripcionActiva($resultado['suscripcion'])) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'La suscripción no está activa'
                ], 422);
            }

            // Verificar si ya existe una empresa con este token
            $empresaExistente = Empresa::where('token_crm', $request->token_crm)->first();
            if ($empresaExistente) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Este token ya está asociado a otra empresa'
                ], 422);
            }

            DB::beginTransaction();

            try {
                $modulos = $crmService->obtenerModulosPorPlan($resultado['suscripcion']['plan']);

                // Crear empresa con datos del CRM
                $empresa = Empresa::create([
                    'nombre_empresa' => $request->nombre_empresa,
                    'nit_empresa' => $request->nit_empresa,
                    'telefono_empresa' => $request->telefono_empresa,
                    'direccion_empresa' => $request->direccion_empresa,
                    'email_empresa' => $request->email_empresa,
                    'token_crm' => $request->token_crm,
                    'id_cliente_crm' => $resultado['cliente']['id'],
                    'plan_actual' => $resultado['suscripcion']['plan'],
                    'fecha_vencimiento_plan' => $resultado['suscripcion']['fecha_vencimiento'],
                    'estado_suscripcion' => $resultado['suscripcion']['estado'],
                    'modulos_habilitados' => $modulos,
                    'ultima_validacion_crm' => Carbon::now()
                ]);

                // Generar código y token de sincronización VB6
                $empresa->codigo_empresa = 'EMP' . str_pad($empresa->id_empresa, 4, '0', STR_PAD_LEFT);
                $empresa->token_api = bin2hex(random_bytes(32));
                $empresa->save();

                // Asociar usuario a la empresa
                DB::table('usuarios_empresas')->insert([
                    'id_usuario' => $usuario->id_usuario,
                    'id_empresa' => $empresa->id_empresa,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now()
                ]);

                DB::commit();

                // Hacer visible los módulos en la respuesta
                $empresa->makeVisible(['plan_actual', 'modulos_habilitados', 'fecha_vencimiento_plan']);

                return response()->json([
                    'error' => false,
                    'mensaje' => 'Empresa creada exitosamente',
                    'empresa' => $empresa
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear empresa: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar información del plan desde el CRM
     */
    public function actualizarPlanDesdeCRM($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $id)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Empresa no encontrada o sin acceso'
                ], 404);
            }

            if (!$empresa->token_crm) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Esta empresa no tiene token CRM asociado'
                ], 422);
            }

            // Validar con CRM
            $crmService = new CRMValidationService();
            $resultado = $crmService->validarToken($empresa->token_crm);

            if (!$resultado['valido']) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Token CRM ya no es válido'
                ], 422);
            }

            // Actualizar datos del plan
            $modulos = $crmService->obtenerModulosPorPlan($resultado['suscripcion']['plan']);

            $empresa->update([
                'plan_actual' => $resultado['suscripcion']['plan'],
                'fecha_vencimiento_plan' => $resultado['suscripcion']['fecha_vencimiento'],
                'estado_suscripcion' => $resultado['suscripcion']['estado'],
                'modulos_habilitados' => $modulos,
                'ultima_validacion_crm' => Carbon::now()
            ]);

            $empresa->makeVisible(['plan_actual', 'modulos_habilitados', 'fecha_vencimiento_plan']);

            return response()->json([
                'error' => false,
                'mensaje' => 'Plan actualizado exitosamente',
                'empresa' => $empresa
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar plan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar acceso a un módulo específico
     */
    public function verificarAccesoModulo(Request $request, $id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $validator = Validator::make($request->all(), [
                'modulo' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Módulo requerido'
                ], 422);
            }

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $id)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Empresa no encontrada'
                ], 404);
            }

            $crmService = new CRMValidationService();
            $tieneAcceso = $crmService->tieneAccesoAModulo(
                $empresa->modulos_habilitados ?? [],
                $request->modulo
            );

            return response()->json([
                'error' => false,
                'tiene_acceso' => $tieneAcceso,
                'modulo' => $request->modulo
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al verificar acceso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sincronizar datos de empresa con CRM
     */
    public function sincronizarConCRM($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $id)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'No tienes acceso a esta empresa'
                ], 403);
            }

            // Verificar que la empresa tenga token CRM
            if (!$empresa->token_crm) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Esta empresa no tiene un token CRM asociado'
                ], 400);
            }

            // Consultar plan completo desde el CRM
            $crmService = new CRMValidationService();
            $validacion = $crmService->consultarPlan($empresa->token_crm);

            if (!$validacion['valido']) {
                return response()->json([
                    'error' => true,
                    'mensaje' => $validacion['mensaje'] ?? 'Token CRM inválido o expirado'
                ], 400);
            }

            $datosCliente = $validacion['cliente'];
            $datosSuscripcion = $validacion['suscripcion'];
            $datosPlan = $validacion['plan'];

            // Obtener módulos según el plan
            $modulos = $crmService->obtenerModulosPorPlan($datosPlan['nombre'] ?? '');

            $empresa->update([
                'nombre_empresa' => $datosCliente['empresa'] ?? $empresa->nombre_empresa,
                'nit_empresa' => $datosCliente['nit'] ?? $empresa->nit_empresa,
                'plan_actual' => $datosPlan['nombre'],
                'fecha_vencimiento_plan' => $datosSuscripcion['fecha_vencimiento'],
                'estado_suscripcion' => $datosSuscripcion['estado'] === 'activa' ? 'activo' : $datosSuscripcion['estado'],
                'modulos_habilitados' => $modulos,
                'ultima_validacion_crm' => Carbon::now()
            ]);

            $empresa->refresh();

            return response()->json([
                'error' => false,
                'mensaje' => 'Datos sincronizados exitosamente con el CRM',
                'empresa' => [
                    'id_empresa' => $empresa->id_empresa,
                    'nombre_empresa' => $empresa->nombre_empresa,
                    'nit_empresa' => $empresa->nit_empresa,
                    'plan_actual' => $empresa->plan_actual,
                    'fecha_vencimiento_plan' => $empresa->fecha_vencimiento_plan,
                    'estado_suscripcion' => $empresa->estado_suscripcion,
                    'modulos_habilitados' => $empresa->modulos_habilitados,
                    'ultima_validacion_crm' => $empresa->ultima_validacion_crm,
                    'dias_restantes' => $datosSuscripcion['dias_restantes'] ?? null
                ],
                'plan' => $datosPlan
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al sincronizar con CRM: ' . $e->getMessage()
            ], 500);
        }
    }
}
