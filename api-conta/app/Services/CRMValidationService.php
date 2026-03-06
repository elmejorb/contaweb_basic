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
        $this->crmBaseUrl = env('CRM_API_URL', 'https://innovacion-digital.com/api/v1');
    }

    /**
     * Validar token con el CRM
     *
     * @param string $token
     * @return array
     */
    public function validarToken(string $token): array
    {
        try {
            // TODO: Agregar credenciales de autenticación si el CRM lo requiere
            $response = Http::timeout(10)
                // ->withHeaders([
                //     'Authorization' => 'Bearer ' . env('CRM_API_KEY'),
                //     // O usar: 'X-API-Key' => env('CRM_API_KEY')
                // ])
                ->get("{$this->crmBaseUrl}/acceso-web/validar-token/{$token}");

            Log::info('Respuesta del CRM', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            if ($response->status() === 401) {
                return [
                    'valido' => false,
                    'mensaje' => 'No autorizado para consultar el CRM. Verifica la configuración de autenticación.'
                ];
            }

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

            // Extraer información relevante
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
     * Obtener módulos habilitados según el plan
     *
     * @param string $plan
     * @return array
     */
    public function obtenerModulosPorPlan(string $plan): array
    {
        // Mapeo de planes a módulos (puedes ajustar según tus necesidades)
        $planesModulos = [
            'Plan Básico' => [
                'facturas',
                'clientes',
                'reportes_basicos'
            ],
            'Plan Profesional' => [
                'facturas',
                'clientes',
                'proveedores',
                'inventario',
                'reportes_basicos',
                'reportes_avanzados'
            ],
            'Plan Empresarial' => [
                'facturas',
                'clientes',
                'proveedores',
                'inventario',
                'caja',
                'contabilidad',
                'nomina',
                'reportes_basicos',
                'reportes_avanzados',
                'multi_usuario',
                'sincronizacion_vb6'
            ],
            'Plan Premium' => [
                'facturas',
                'clientes',
                'proveedores',
                'inventario',
                'caja',
                'contabilidad',
                'nomina',
                'reportes_basicos',
                'reportes_avanzados',
                'reportes_personalizados',
                'multi_usuario',
                'multi_empresa',
                'sincronizacion_vb6',
                'api_integraciones',
                'soporte_prioritario'
            ]
        ];

        return $planesModulos[$plan] ?? [];
    }

    /**
     * Verificar si un módulo está habilitado para una empresa
     *
     * @param array $modulosHabilitados
     * @param string $modulo
     * @return bool
     */
    public function tieneAccesoAModulo(array $modulosHabilitados, string $modulo): bool
    {
        return in_array($modulo, $modulosHabilitados);
    }

    /**
     * Verificar si la suscripción está activa
     *
     * @param array $suscripcion
     * @return bool
     */
    public function suscripcionActiva(array $suscripcion): bool
    {
        if (!isset($suscripcion['estado'])) {
            return false;
        }

        if ($suscripcion['estado'] !== 'activo') {
            return false;
        }

        // Verificar fecha de vencimiento
        if (isset($suscripcion['fecha_vencimiento'])) {
            $fechaVencimiento = Carbon::parse($suscripcion['fecha_vencimiento']);
            return $fechaVencimiento->isFuture() || $fechaVencimiento->isToday();
        }

        return true;
    }

    /**
     * Obtener días restantes de la suscripción
     *
     * @param string $fechaVencimiento
     * @return int
     */
    public function diasRestantes(string $fechaVencimiento): int
    {
        $fecha = Carbon::parse($fechaVencimiento);
        $hoy = Carbon::now();

        return $hoy->diffInDays($fecha, false);
    }
}
