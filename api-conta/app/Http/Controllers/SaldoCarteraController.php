<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SaldoCartera;
use App\Models\Usuario;
use App\Models\Empresa;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SaldoCarteraController extends Controller
{
    /**
     * Listar saldos de cartera de clientes
     */
    public function listarClientes(Request $request)
    {
        try {
            $empresaId = $request->input('id_empresa');

            if (!$empresaId) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Debe proporcionar id_empresa'
                ], 400);
            }

            $saldos = SaldoCartera::where('id_empresa', $empresaId)
                                  ->where('tipo', 'cliente')
                                  ->orderBy('saldo_total', 'DESC')
                                  ->get();

            return response()->json([
                'error' => false,
                'saldos' => $saldos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al listar cartera de clientes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar saldos de cartera de proveedores
     */
    public function listarProveedores(Request $request)
    {
        try {
            $empresaId = $request->input('id_empresa');

            if (!$empresaId) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Debe proporcionar id_empresa'
                ], 400);
            }

            $saldos = SaldoCartera::where('id_empresa', $empresaId)
                                  ->where('tipo', 'proveedor')
                                  ->orderBy('saldo_total', 'DESC')
                                  ->get();

            return response()->json([
                'error' => false,
                'saldos' => $saldos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al listar cartera de proveedores: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sincronizar cartera de clientes (puede recibir uno o varios registros)
     *
     * Request puede ser:
     * 1. Un solo registro: { "codigo": "130843", "nombre": "EVER HERNANDEZ", "saldo": 1107716.00 }
     * 2. Un array: [{ "codigo": "130843", "nombre": "EVER HERNANDEZ", "saldo": 1107716.00 }, ...]
     */
    public function sincronizarClientes(Request $request)
    {
        try {
            $empresaId = $request->user()->empresaActiva->id_empresa ?? null;

            if (!$empresaId) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'No hay empresa activa'
                ], 400);
            }

            $data = $request->all();

            // Si no es un array (es un solo registro), convertirlo en array
            if (!isset($data[0])) {
                $data = [$data];
            }

            // Validar estructura
            $validator = Validator::make(['registros' => $data], [
                'registros' => 'required|array',
                'registros.*.codigo' => 'required|string|max:50',
                'registros.*.nombre' => 'required|string|max:255',
                'registros.*.saldo' => 'required|numeric'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $registrosCreados = 0;
            $registrosActualizados = 0;

            foreach ($data as $registro) {
                $saldo = SaldoCartera::updateOrCreate(
                    [
                        'id_empresa' => $empresaId,
                        'codigo_tercero' => $registro['codigo'],
                        'tipo' => 'cliente'
                    ],
                    [
                        'nombre_tercero' => $registro['nombre'],
                        'saldo_total' => $registro['saldo']
                    ]
                );

                if ($saldo->wasRecentlyCreated) {
                    $registrosCreados++;
                } else {
                    $registrosActualizados++;
                }
            }

            DB::commit();

            return response()->json([
                'error' => false,
                'mensaje' => 'Cartera de clientes sincronizada exitosamente',
                'registros_creados' => $registrosCreados,
                'registros_actualizados' => $registrosActualizados,
                'total_procesados' => count($data)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al sincronizar cartera de clientes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sincronizar cartera de proveedores (puede recibir uno o varios registros)
     */
    public function sincronizarProveedores(Request $request)
    {
        try {
            $empresaId = $request->user()->empresaActiva->id_empresa ?? null;

            if (!$empresaId) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'No hay empresa activa'
                ], 400);
            }

            $data = $request->all();

            // Si no es un array (es un solo registro), convertirlo en array
            if (!isset($data[0])) {
                $data = [$data];
            }

            // Validar estructura
            $validator = Validator::make(['registros' => $data], [
                'registros' => 'required|array',
                'registros.*.codigo' => 'required|string|max:50',
                'registros.*.nombre' => 'required|string|max:255',
                'registros.*.saldo' => 'required|numeric'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $registrosCreados = 0;
            $registrosActualizados = 0;

            foreach ($data as $registro) {
                $saldo = SaldoCartera::updateOrCreate(
                    [
                        'id_empresa' => $empresaId,
                        'codigo_tercero' => $registro['codigo'],
                        'tipo' => 'proveedor'
                    ],
                    [
                        'nombre_tercero' => $registro['nombre'],
                        'saldo_total' => $registro['saldo']
                    ]
                );

                if ($saldo->wasRecentlyCreated) {
                    $registrosCreados++;
                } else {
                    $registrosActualizados++;
                }
            }

            DB::commit();

            return response()->json([
                'error' => false,
                'mensaje' => 'Cartera de proveedores sincronizada exitosamente',
                'registros_creados' => $registrosCreados,
                'registros_actualizados' => $registrosActualizados,
                'total_procesados' => count($data)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al sincronizar cartera de proveedores: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener resumen de cartera (clientes y proveedores)
     */
    public function resumen(Request $request)
    {
        try {
            $empresaId = $request->input('id_empresa');

            if (!$empresaId) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Debe proporcionar id_empresa'
                ], 400);
            }

            $resumenClientes = SaldoCartera::where('id_empresa', $empresaId)
                                           ->where('tipo', 'cliente')
                                           ->selectRaw('COUNT(*) as total_clientes, SUM(saldo_total) as total_por_cobrar')
                                           ->first();

            $resumenProveedores = SaldoCartera::where('id_empresa', $empresaId)
                                              ->where('tipo', 'proveedor')
                                              ->selectRaw('COUNT(*) as total_proveedores, SUM(saldo_total) as total_por_pagar')
                                              ->first();

            return response()->json([
                'error' => false,
                'resumen' => [
                    'clientes' => [
                        'cantidad' => $resumenClientes->total_clientes ?? 0,
                        'total_por_cobrar' => $resumenClientes->total_por_cobrar ?? 0
                    ],
                    'proveedores' => [
                        'cantidad' => $resumenProveedores->total_proveedores ?? 0,
                        'total_por_pagar' => $resumenProveedores->total_por_pagar ?? 0
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener resumen de cartera: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un saldo de cartera
     */
    public function eliminar(Request $request, $id)
    {
        try {
            $empresaId = $request->input('id_empresa');

            $saldo = SaldoCartera::where('id_empresa', $empresaId)
                                 ->where('id_saldo_cartera', $id)
                                 ->first();

            if (!$saldo) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Registro no encontrado'
                ], 404);
            }

            $saldo->delete();

            return response()->json([
                'error' => false,
                'mensaje' => 'Registro eliminado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al eliminar registro: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recibir lote de saldos desde VB6
     *
     * Request esperado:
     * {
     *   "email": "usuario@ejemplo.com",
     *   "token_api": "token_de_la_empresa",
     *   "tipo": "cliente" o "proveedor",
     *   "registros": [
     *     {
     *       "codigo": "130843",
     *       "nombre": "EVER HERNANDEZ",
     *       "saldo": 1107716.00
     *     },
     *     ...
     *   ]
     * }
     */
    public function recibirLoteDesdeVB6(Request $request)
    {
        try {
            // DEBUG: Capturar toda la información del request
            $rawContent = $request->getContent();
            $parsedData = $request->all();

            // Validar estructura básica
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'token_api' => 'required|string',
                'tipo' => 'nullable|in:cliente,proveedor', // Opcional, por defecto "cliente"
                'registros' => 'required|array|min:1|max:500'
            ]);

            if ($validator->fails()) {
                // Guardar el JSON raw en un archivo para debugging
                $debugFile = storage_path('logs/saldos_debug_' . date('Y-m-d_H-i-s') . '.json');
                file_put_contents($debugFile, $rawContent);

                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors(),
                    'debug_info' => [
                        'raw_content_length' => strlen($rawContent),
                        'raw_content_completo' => $rawContent,
                        'parsed_data' => $parsedData,
                        'tiene_tipo' => isset($parsedData['tipo']),
                        'tipo_valor' => isset($parsedData['tipo']) ? $parsedData['tipo'] : 'NO EXISTE',
                        'content_type' => $request->header('Content-Type'),
                        'archivo_debug' => $debugFile
                    ]
                ], 422);
            }

            // Validar credenciales
            $usuario = Usuario::where('email_us', $request->email)->first();
            if (!$usuario) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Credenciales inválidas - Usuario no encontrado'
                ], 401);
            }

            $empresa = Empresa::where('token_api', $request->token_api)->first();
            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Credenciales inválidas - Token API no encontrado'
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

            $registros = $request->registros;
            $tipo = $request->tipo ?? 'cliente'; // Si no viene, usar "cliente" por defecto
            $insertados = 0;
            $actualizados = 0;
            $errores = [];

            DB::beginTransaction();

            // Auto-detectar si es el primer batch de una sincronización:
            // Si el último updated_at de saldos de esta empresa es de hace más de 30 segundos,
            // significa que es una nueva sincronización y hay que resetear.
            // Si es reciente (<30s), es un batch consecutivo, no resetear.
            $ultimoUpdate = SaldoCartera::where('id_empresa', $empresa->id_empresa)
                ->where('tipo', $tipo)
                ->max('updated_at');

            $esNuevaSincronizacion = true;
            if ($ultimoUpdate) {
                $segundosDesdeUltimo = \Carbon\Carbon::now()->diffInSeconds(\Carbon\Carbon::parse($ultimoUpdate));
                $esNuevaSincronizacion = $segundosDesdeUltimo > 30;
            }

            // También permitir forzar con reset_saldos=true/false explícito
            if ($request->has('reset_saldos')) {
                $esNuevaSincronizacion = filter_var($request->input('reset_saldos'), FILTER_VALIDATE_BOOLEAN);
            }

            if ($esNuevaSincronizacion) {
                SaldoCartera::where('id_empresa', $empresa->id_empresa)
                    ->where('tipo', $tipo)
                    ->where('saldo_total', '!=', 0)
                    ->update(['saldo_total' => 0]);
            }

            foreach ($registros as $index => $data) {
                try {
                    // Obtener valores (soporta ambos formatos: VB6 y genérico)
                    $codigo = $data['CodigoCli'] ?? $data['codigo'] ?? null;
                    $nombre = $data['Cliente'] ?? $data['nombre'] ?? null;
                    $saldo = $data['SaldoTotal'] ?? $data['saldo'] ?? null;

                    // Validar campos requeridos
                    if (empty($codigo)) {
                        $errores[] = "Registro $index: Falta el código";
                        continue;
                    }

                    if (!isset($nombre) || trim($nombre) === '') {
                        $errores[] = "Registro $index: Falta el nombre";
                        continue;
                    }

                    if (!isset($saldo) || !is_numeric($saldo)) {
                        $errores[] = "Registro $index: Saldo inválido";
                        continue;
                    }

                    // Usar updateOrCreate para insertar o actualizar
                    $saldoCartera = SaldoCartera::updateOrCreate(
                        [
                            'id_empresa' => $empresa->id_empresa,
                            'codigo_tercero' => $codigo,
                            'tipo' => $tipo
                        ],
                        [
                            'nombre_tercero' => $nombre,
                            'saldo_total' => $saldo
                        ]
                    );

                    if ($saldoCartera->wasRecentlyCreated) {
                        $insertados++;
                    } else {
                        $actualizados++;
                    }

                } catch (\Exception $e) {
                    $errores[] = "Registro $index (código: {$codigo}): " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'error' => false,
                'mensaje' => 'Lote procesado exitosamente',
                'resultado' => [
                    'insertados' => $insertados,
                    'actualizados' => $actualizados,
                    'total_procesados' => $insertados + $actualizados,
                    'errores' => count($errores),
                    'detalles_errores' => $errores
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al procesar lote: ' . $e->getMessage()
            ], 500);
        }
    }
}
