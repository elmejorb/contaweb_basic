<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CRMValidationService
{
    private $crmBaseUrl;

    public function __construct()
    {
        $this->crmBaseUrl = env('CRM_API_URL', 'https://crm.innovacion-digital.com/api/public/api/v1');
    }

    /**
     * Validar token con el CRM (endpoint original de acceso-web)
     */
    public function validarToken(string $token): array
    {
        try {
            $response = Http::timeout(10)
                ->get("{$this->crmBaseUrl}/acceso-web/validar-token/{$token}");

            if (!$response->successful()) {
                return [
                    'valido' => false,
                    'mensaje' => 'Error al conectar con el CRM: ' . $response->status()
                ];
            }

            $data = $response->json();

            if (!isset($data['success']) || !$data['success']) {
                return [
                    'valido' => false,
                    'mensaje' => $data['message'] ?? 'Token inválido'
                ];
            }

            $resultado = [
                'valido' => $data['data']['valido'] ?? false,
                'cliente' => $data['data']['cliente'] ?? null,
                'suscripcion' => $data['data']['suscripcion'] ?? null
            ];

            return $resultado;

        } catch (\Exception $e) {
            Log::error('Error al validar token con CRM: ' . $e->getMessage());
            return [
                'valido' => false,
                'mensaje' => 'Error de conexión con el CRM: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Consultar plan completo desde el CRM
     * Retorna info del cliente, plan con características/servicios, y suscripción
     */
    public function consultarPlan(string $token): array
    {
        try {
            $response = Http::timeout(10)
                ->get("{$this->crmBaseUrl}/consulta-plan/{$token}");

            if (!$response->successful()) {
                return [
                    'valido' => false,
                    'mensaje' => 'Error al consultar plan: ' . $response->status()
                ];
            }

            $data = $response->json();

            if (!isset($data['success']) || !$data['success']) {
                return [
                    'valido' => false,
                    'mensaje' => $data['message'] ?? 'Token inválido'
                ];
            }

            $planData = $data['data'];

            if (!($planData['tiene_plan'] ?? false)) {
                return [
                    'valido' => false,
                    'mensaje' => 'El cliente no tiene un plan activo'
                ];
            }

            $plan = $planData['plan'] ?? [];
            $suscripcion = $planData['suscripcion'] ?? [];

            return [
                'valido' => true,
                'cliente' => $planData['cliente'] ?? null,
                'plan' => [
                    'id' => $plan['id'] ?? null,
                    'nombre' => $plan['nombre'] ?? null,
                    'descripcion' => $plan['descripcion'] ?? null,
                    'valor_mensual' => $plan['valor_mensual'] ?? null,
                    'valor_anual' => $plan['valor_anual'] ?? null,
                    'implementacion' => $plan['implementacion'] ?? null,
                    'destacado' => $plan['destacado'] ?? false,
                    'producto' => $plan['producto'] ?? null,
                    'caracteristicas' => $plan['caracteristicas'] ?? [],
                    'servicios' => $plan['servicios'] ?? [],
                ],
                'suscripcion' => [
                    'plan' => $plan['nombre'] ?? null,
                    'estado' => $suscripcion['estado'] ?? 'inactivo',
                    'periodo_facturacion' => $suscripcion['periodo_facturacion'] ?? null,
                    'fecha_inicio' => $suscripcion['fecha_inicio'] ?? null,
                    'fecha_vencimiento' => $suscripcion['fecha_fin'] ?? null,
                    'siguiente_cobro' => $suscripcion['siguiente_cobro'] ?? null,
                    'dias_restantes' => $suscripcion['dias_restantes'] ?? 0,
                    'renovacion_automatica' => $suscripcion['renovacion_automatica'] ?? false,
                ],
            ];

        } catch (\Exception $e) {
            Log::error('Error al consultar plan con CRM: ' . $e->getMessage());
            return [
                'valido' => false,
                'mensaje' => 'Error de conexión con el CRM: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Obtener módulos habilitados según el plan
     */
    public function obtenerModulosPorPlan(string $plan): array
    {
        // Módulos básicos (Preferencial)
        $modulosBasicos = [
            'facturas',
            'clientes',
            'inventario',
            'caja',
            'reportes_basicos',
            'sincronizacion_vb6'
        ];

        // Módulos completos (Plan Pro y Plan Full)
        $modulosCompletos = array_merge($modulosBasicos, [
            'proveedores',
            'compras',
            'gastos',
            'contabilidad',
            'reportes_avanzados',
            'reportes_personalizados',
            'estado_resultados',
            'multi_usuario',
            'multi_empresa',
            'api_integraciones',
            'soporte_prioritario',
            'facturacion_dian'
        ]);

        // Mapeo de planes reales del CRM
        $planesModulos = [
            'Preferencial' => $modulosBasicos,
            'Plan Pro' => $modulosCompletos,
            'Plan Full' => $modulosCompletos,
        ];

        return $planesModulos[$plan] ?? [];
    }

    /**
     * Verificar si un módulo está habilitado para una empresa
     */
    public function tieneAccesoAModulo(array $modulosHabilitados, string $modulo): bool
    {
        return in_array($modulo, $modulosHabilitados);
    }

    /**
     * Verificar si la suscripción está activa
     */
    public function suscripcionActiva(array $suscripcion): bool
    {
        $estado = $suscripcion['estado'] ?? null;

        if (!$estado) {
            return false;
        }

        // El CRM puede retornar 'activo' o 'activa'
        if (!in_array($estado, ['activo', 'activa', 'prueba'])) {
            return false;
        }

        if (isset($suscripcion['fecha_vencimiento'])) {
            $fechaVencimiento = Carbon::parse($suscripcion['fecha_vencimiento']);
            return $fechaVencimiento->isFuture() || $fechaVencimiento->isToday();
        }

        return true;
    }

    /**
     * Obtener días restantes de la suscripción
     */
    public function diasRestantes(string $fechaVencimiento): int
    {
        $fecha = Carbon::parse($fechaVencimiento);
        $hoy = Carbon::now();

        return $hoy->diffInDays($fecha, false);
    }
}
