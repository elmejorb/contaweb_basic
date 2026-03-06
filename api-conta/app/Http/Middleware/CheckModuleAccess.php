<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\Empresa;
use App\Services\CRMValidationService;
use Tymon\JWTAuth\Facades\JWTAuth;

class CheckModuleAccess
{
    /**
     * Verificar que el usuario tenga acceso al módulo solicitado
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $modulo
     * @return mixed
     */
    public function handle($request, Closure $next, $modulo)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Obtener id_empresa desde la request (puede venir como parámetro, query o body)
            $idEmpresa = $request->route('id_empresa')
                        ?? $request->get('id_empresa')
                        ?? $request->input('id_empresa');

            if (!$idEmpresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Se requiere id_empresa'
                ], 422);
            }

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $idEmpresa)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'No tiene acceso a esta empresa'
                ], 403);
            }

            // Si la empresa no tiene plan configurado, permitir acceso (para empresas legacy)
            if (!$empresa->token_crm || !$empresa->modulos_habilitados) {
                return $next($request);
            }

            // Verificar que el módulo esté habilitado
            $crmService = new CRMValidationService();
            $tieneAcceso = $crmService->tieneAccesoAModulo(
                $empresa->modulos_habilitados ?? [],
                $modulo
            );

            if (!$tieneAcceso) {
                return response()->json([
                    'error' => true,
                    'mensaje' => "No tiene acceso al módulo: {$modulo}",
                    'plan_actual' => $empresa->plan_actual,
                    'modulo_requerido' => $modulo
                ], 403);
            }

            // Verificar que la suscripción esté activa
            if ($empresa->estado_suscripcion !== 'activo') {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Su suscripción no está activa',
                    'estado_suscripcion' => $empresa->estado_suscripcion
                ], 403);
            }

            return $next($request);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al verificar acceso: ' . $e->getMessage()
            ], 500);
        }
    }
}
