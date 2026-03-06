<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\VentaDetalle;
use App\Models\Cliente;
use App\Models\Producto;
use App\Models\Empresa;
use App\Models\Usuario;
use App\Models\TipoDocumentoFacturacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class VentaController extends Controller
{
    /**
     * Listar ventas con paginación, búsqueda y filtros
     */
    public function listar(Request $request)
    {
        try {
            $id_empresa = $request->input('id_empresa');
            $page = $request->input('page', 1);
            $perPage = $request->input('perPage', 10);
            $search = $request->input('buscar') ?? $request->input('search');
            $fecha_inicio = $request->input('fecha_inicio');
            $fecha_fin = $request->input('fecha_fin');
            $id_tipo_documento = $request->input('id_tipo_documento');

            $query = Venta::with(['cliente', 'usuario', 'tipoDocumento'])
                          ->where('id_empresa', $id_empresa);

            // Filtro por tipo de documento
            if ($id_tipo_documento) {
                $query->where('id_tipo_documento', $id_tipo_documento);
            }

            // Filtro por rango de fechas
            if ($fecha_inicio) {
                $query->where('fecha_venta', '>=', $fecha_inicio);
            }
            if ($fecha_fin) {
                $query->where('fecha_venta', '<=', $fecha_fin);
            }

            // Búsqueda por número de factura o cliente
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('numero_factura', 'LIKE', "%{$search}%")
                      ->orWhereHas('cliente', function($qc) use ($search) {
                          $qc->where('nombre_razon_social', 'LIKE', "%{$search}%")
                             ->orWhere('numero_documento', 'LIKE', "%{$search}%");
                      });
                });
            }

            $total = $query->count();
            $ventas = $query->orderBy('fecha_venta', 'desc')
                           ->orderBy('id_venta', 'desc')
                           ->skip(($page - 1) * $perPage)
                           ->take($perPage)
                           ->get();

            return response()->json([
                'error' => false,
                'ventas' => $ventas,
                'total' => $total,
                'per_page' => (int) $perPage,
                'current_page' => (int) $page,
                'last_page' => (int) ceil($total / $perPage)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al listar ventas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener una venta por ID con sus detalles
     */
    public function obtener($id)
    {
        try {
            $venta = Venta::with(['cliente', 'usuario', 'tipoDocumento', 'detalles.producto'])
                          ->find($id);

            if (!$venta) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Venta no encontrada'
                ], 404);
            }

            return response()->json([
                'error' => false,
                'venta' => $venta
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener venta: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recibir venta desde VB6
     */
    public function recibirDesdeVB6(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'token_api' => 'required|string',
                'Factura_N' => 'required'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Validar credenciales
            $usuario = Usuario::where('email_us', $request->email)->first();
            if (!$usuario) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Credenciales inválidas'
                ], 401);
            }

            $empresa = Empresa::where('token_api', $request->token_api)->first();
            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Credenciales inválidas'
                ], 401);
            }

            // Verificar acceso
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

            // Obtener tipo de documento VB6
            $tipoDocVB6 = TipoDocumentoFacturacion::where('codigo', 'VB6')->first();

            // Buscar cliente por codvb6
            $cliente = Cliente::where('id_empresa', $empresa->id_empresa)
                              ->where('codvb6', $request->CodigoCli)
                              ->first();

            // Si no existe el cliente, crear uno genérico o buscar por identificación
            if (!$cliente) {
                $cliente = Cliente::where('id_empresa', $empresa->id_empresa)
                                  ->where('numero_documento', $request->Identificacion)
                                  ->first();
            }

            // Buscar venta existente por codvb6 (Factura_N)
            $venta = Venta::where('id_empresa', $empresa->id_empresa)
                          ->where('codvb6', $request->Factura_N)
                          ->first();

            // Mapear forma de pago
            $formaPago = $this->mapearFormaPago($request->Tipo, $request->id_mediopago);

            // Calcular subtotal (Total - Impuesto)
            $total = floatval($request->Total ?? 0);
            $impuesto = floatval($request->Impuesto ?? 0);
            $descuento = floatval($request->Descuento ?? 0);
            $subtotal = $total - $impuesto;

            $datosVenta = [
                'id_cliente' => $cliente ? $cliente->id_cliente : null,
                'id_usuario' => $usuario->id_usuario,
                'id_estado' => $this->mapearEstado($request->EstadoFact, $request->pagada),
                'id_tipo_documento' => $tipoDocVB6 ? $tipoDocVB6->id_tipo_documento : null,
                'numero_factura' => $request->Factura_N,
                'fecha_venta' => $this->parsearFecha($request->Fecha),
                'subtotal' => $subtotal,
                'total_impuestos' => $impuesto,
                'descuento' => $descuento,
                'total' => $total,
                'forma_pago' => $formaPago,
                'observaciones' => $request->Comentario ?? '',
                'sincronizado' => 'S',
                'editable' => false // Ventas de VB6 no son editables
            ];

            $accion = 'creada';
            if ($venta) {
                $venta->update($datosVenta);
                $accion = 'actualizada';
            } else {
                $datosVenta['id_empresa'] = $empresa->id_empresa;
                $datosVenta['codvb6'] = $request->Factura_N;
                $venta = Venta::create($datosVenta);
            }

            // Procesar detalles si vienen incluidos
            $detallesProcesados = 0;
            if ($request->has('detalles') && is_array($request->detalles)) {
                // Eliminar detalles anteriores si es actualización
                if ($accion == 'actualizada') {
                    VentaDetalle::where('id_venta', $venta->id_venta)->delete();
                }

                foreach ($request->detalles as $detalle) {
                    $this->procesarDetalle($venta, $detalle, $empresa->id_empresa);
                    $detallesProcesados++;
                }
            }

            return response()->json([
                'error' => false,
                'mensaje' => "Venta {$accion} desde VB6",
                'accion' => $accion,
                'venta' => $venta,
                'detalles_procesados' => $detallesProcesados
            ], $accion == 'creada' ? 201 : 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al recibir venta desde VB6: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recibir lote de ventas desde VB6 (batch)
     */
    public function recibirLoteDesdeVB6(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'token_api' => 'required|string',
                'registros' => 'required|array|min:1|max:50'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Validar credenciales
            $usuario = Usuario::where('email_us', $request->email)->first();
            if (!$usuario) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Credenciales inválidas'
                ], 401);
            }

            $empresa = Empresa::where('token_api', $request->token_api)->first();
            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Credenciales inválidas'
                ], 401);
            }

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

            // Obtener tipo de documento VB6
            $tipoDocVB6 = TipoDocumentoFacturacion::where('codigo', 'VB6')->first();

            $registros = $request->registros;
            $insertados = 0;
            $actualizados = 0;
            $errores = [];

            foreach ($registros as $index => $data) {
                try {
                    if (empty($data['Factura_N'])) {
                        $errores[] = "Registro $index: Falta número de factura";
                        continue;
                    }

                    // Buscar cliente
                    $cliente = null;
                    if (!empty($data['CodigoCli'])) {
                        $cliente = Cliente::where('id_empresa', $empresa->id_empresa)
                                          ->where('codvb6', $data['CodigoCli'])
                                          ->first();
                    }
                    if (!$cliente && !empty($data['Identificacion'])) {
                        $cliente = Cliente::where('id_empresa', $empresa->id_empresa)
                                          ->where('numero_documento', $data['Identificacion'])
                                          ->first();
                    }

                    $formaPago = $this->mapearFormaPago($data['Tipo'] ?? '', $data['id_mediopago'] ?? null);

                    $total = floatval($data['Total'] ?? 0);
                    $impuesto = floatval($data['Impuesto'] ?? 0);
                    $descuento = floatval($data['Descuento'] ?? 0);
                    $subtotal = $total - $impuesto;

                    $datosVenta = [
                        'id_cliente' => $cliente ? $cliente->id_cliente : null,
                        'id_usuario' => $usuario->id_usuario,
                        'id_estado' => $this->mapearEstado($data['EstadoFact'] ?? '', $data['pagada'] ?? ''),
                        'id_tipo_documento' => $tipoDocVB6 ? $tipoDocVB6->id_tipo_documento : null,
                        'numero_factura' => $data['Factura_N'],
                        'fecha_venta' => $this->parsearFecha($data['Fecha'] ?? null),
                        'subtotal' => $subtotal,
                        'total_impuestos' => $impuesto,
                        'descuento' => $descuento,
                        'total' => $total,
                        'forma_pago' => $formaPago,
                        'observaciones' => $data['Comentario'] ?? '',
                        't_utilidad_vent' => floatval($data['utilidad'] ?? 0),
                        'sincronizado' => 'S',
                        'editable' => false
                    ];

                    $venta = Venta::where('id_empresa', $empresa->id_empresa)
                                  ->where('codvb6', $data['Factura_N'])
                                  ->first();

                    $esActualizacion = false;
                    if ($venta) {
                        $venta->update($datosVenta);
                        $actualizados++;
                        $esActualizacion = true;
                    } else {
                        $datosVenta['id_empresa'] = $empresa->id_empresa;
                        $datosVenta['codvb6'] = $data['Factura_N'];
                        $venta = Venta::create($datosVenta);
                        $insertados++;
                    }

                    // Procesar detalles si vienen incluidos
                    if (!empty($data['detalles']) && is_array($data['detalles'])) {
                        if ($esActualizacion) {
                            VentaDetalle::where('id_venta', $venta->id_venta)->delete();
                        }
                        foreach ($data['detalles'] as $detalle) {
                            $this->procesarDetalle($venta, $detalle, $empresa->id_empresa);
                        }
                    }
                } catch (\Exception $e) {
                    $errores[] = "Factura {$data['Factura_N']}: " . $e->getMessage();
                }
            }

            return response()->json([
                'error' => false,
                'mensaje' => 'Lote de ventas procesado correctamente',
                'insertados' => $insertados,
                'actualizados' => $actualizados,
                'total_procesados' => $insertados + $actualizados,
                'total_errores' => count($errores),
                'errores' => $errores
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al procesar lote de ventas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resumen de ventas para Dashboard
     */
    public function resumen(Request $request)
    {
        try {
            $empresaId = $request->input('id_empresa');
            if (!$empresaId) {
                return response()->json(['error' => true, 'mensaje' => 'Debe proporcionar id_empresa'], 400);
            }

            $hoy = date('Y-m-d');
            $anioActual = date('Y');
            $anioAnterior = $anioActual - 1;
            $primerDiaMes = date('Y-m-01');
            $hace7Dias = date('Y-m-d', strtotime('-6 days'));

            // Ventas del día
            $ventasHoy = Venta::where('id_empresa', $empresaId)
                ->where('fecha_venta', $hoy)
                ->selectRaw('COALESCE(SUM(total), 0) as total, COALESCE(SUM(t_utilidad_vent), 0) as utilidad')
                ->first();

            // Ventas del mes
            $ventasMes = Venta::where('id_empresa', $empresaId)
                ->where('fecha_venta', '>=', $primerDiaMes)
                ->where('fecha_venta', '<=', $hoy)
                ->selectRaw("
                    COALESCE(SUM(total), 0) as total,
                    COALESCE(SUM(CASE WHEN forma_pago = 'contado' THEN total ELSE 0 END), 0) as contado,
                    COALESCE(SUM(CASE WHEN forma_pago = 'credito' THEN total ELSE 0 END), 0) as credito,
                    COALESCE(SUM(t_utilidad_vent), 0) as utilidad,
                    COUNT(*) as cantidad
                ")
                ->first();

            // Ventas últimos 7 días (agrupadas por día)
            $ventasSemana = Venta::where('id_empresa', $empresaId)
                ->where('fecha_venta', '>=', $hace7Dias)
                ->where('fecha_venta', '<=', $hoy)
                ->selectRaw("DATE(fecha_venta) as fecha, COALESCE(SUM(total), 0) as total")
                ->groupBy(DB::raw('DATE(fecha_venta)'))
                ->orderBy('fecha')
                ->get();

            // Ventas mensuales del año actual (para gráfico)
            $ventasMensualesActual = Venta::where('id_empresa', $empresaId)
                ->whereYear('fecha_venta', $anioActual)
                ->selectRaw("
                    MONTH(fecha_venta) as mes,
                    COALESCE(SUM(CASE WHEN forma_pago = 'contado' THEN total ELSE 0 END), 0) as contado,
                    COALESCE(SUM(CASE WHEN forma_pago = 'credito' THEN total ELSE 0 END), 0) as credito,
                    COALESCE(SUM(total), 0) as total,
                    COALESCE(SUM(t_utilidad_vent), 0) as utilidad
                ")
                ->groupBy(DB::raw('MONTH(fecha_venta)'))
                ->orderBy('mes')
                ->get()
                ->keyBy('mes');

            // Ventas mensuales del año anterior (para comparación)
            $ventasMensualesAnterior = Venta::where('id_empresa', $empresaId)
                ->whereYear('fecha_venta', $anioAnterior)
                ->selectRaw("
                    MONTH(fecha_venta) as mes,
                    COALESCE(SUM(total), 0) as total
                ")
                ->groupBy(DB::raw('MONTH(fecha_venta)'))
                ->orderBy('mes')
                ->get()
                ->keyBy('mes');

            // Construir array de 12 meses
            $mensuales = [];
            for ($m = 1; $m <= 12; $m++) {
                $actual = $ventasMensualesActual->get($m);
                $anterior = $ventasMensualesAnterior->get($m);
                $mensuales[] = [
                    'mes' => $m,
                    'contado' => $actual ? floatval($actual->contado) : 0,
                    'credito' => $actual ? floatval($actual->credito) : 0,
                    'total' => $actual ? floatval($actual->total) : 0,
                    'utilidad' => $actual ? floatval($actual->utilidad) : 0,
                    'total_anterior' => $anterior ? floatval($anterior->total) : 0,
                ];
            }

            // Total año actual y anterior
            $totalAnioActual = Venta::where('id_empresa', $empresaId)
                ->whereYear('fecha_venta', $anioActual)
                ->selectRaw("
                    COALESCE(SUM(total), 0) as total,
                    COALESCE(SUM(CASE WHEN forma_pago = 'contado' THEN total ELSE 0 END), 0) as contado,
                    COALESCE(SUM(CASE WHEN forma_pago = 'credito' THEN total ELSE 0 END), 0) as credito,
                    COALESCE(SUM(t_utilidad_vent), 0) as utilidad
                ")
                ->first();

            $totalAnioAnterior = Venta::where('id_empresa', $empresaId)
                ->whereYear('fecha_venta', $anioAnterior)
                ->selectRaw("COALESCE(SUM(total), 0) as total")
                ->first();

            return response()->json([
                'error' => false,
                'ventas_hoy' => [
                    'total' => floatval($ventasHoy->total),
                    'utilidad' => floatval($ventasHoy->utilidad),
                ],
                'ventas_mes' => [
                    'total' => floatval($ventasMes->total),
                    'contado' => floatval($ventasMes->contado),
                    'credito' => floatval($ventasMes->credito),
                    'utilidad' => floatval($ventasMes->utilidad),
                    'cantidad' => intval($ventasMes->cantidad),
                ],
                'ventas_semana' => $ventasSemana,
                'ventas_mensuales' => $mensuales,
                'anio_actual' => [
                    'total' => floatval($totalAnioActual->total),
                    'contado' => floatval($totalAnioActual->contado),
                    'credito' => floatval($totalAnioActual->credito),
                    'utilidad' => floatval($totalAnioActual->utilidad),
                ],
                'anio_anterior' => [
                    'total' => floatval($totalAnioAnterior->total),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => true, 'mensaje' => 'Error al obtener resumen: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Reporte mensual detallado
     * Params: id_empresa, anio, mes
     */
    public function reporteMensual(Request $request)
    {
        try {
            $empresaId = $request->input('id_empresa');
            if (!$empresaId) {
                return response()->json(['error' => true, 'mensaje' => 'Debe proporcionar id_empresa'], 400);
            }

            $anio = $request->input('anio', date('Y'));
            $mes = $request->input('mes', date('n'));

            // Ventas del mes agrupadas por día
            $ventasPorDia = Venta::where('id_empresa', $empresaId)
                ->whereYear('fecha_venta', $anio)
                ->whereMonth('fecha_venta', $mes)
                ->selectRaw("
                    DATE(fecha_venta) as fecha,
                    COUNT(*) as cantidad,
                    COALESCE(SUM(total), 0) as total,
                    COALESCE(SUM(CASE WHEN forma_pago = 'contado' THEN total ELSE 0 END), 0) as contado,
                    COALESCE(SUM(CASE WHEN forma_pago = 'credito' THEN total ELSE 0 END), 0) as credito,
                    COALESCE(SUM(t_utilidad_vent), 0) as utilidad
                ")
                ->groupBy(DB::raw('DATE(fecha_venta)'))
                ->orderBy('fecha')
                ->get();

            // Totales del mes
            $totalMes = Venta::where('id_empresa', $empresaId)
                ->whereYear('fecha_venta', $anio)
                ->whereMonth('fecha_venta', $mes)
                ->selectRaw("
                    COUNT(*) as cantidad,
                    COALESCE(SUM(total), 0) as total,
                    COALESCE(SUM(CASE WHEN forma_pago = 'contado' THEN total ELSE 0 END), 0) as contado,
                    COALESCE(SUM(CASE WHEN forma_pago = 'credito' THEN total ELSE 0 END), 0) as credito,
                    COALESCE(SUM(t_utilidad_vent), 0) as utilidad,
                    COALESCE(SUM(total_impuestos), 0) as impuestos,
                    COALESCE(SUM(descuento), 0) as descuentos
                ")
                ->first();

            // Top 10 clientes del mes
            $topClientes = Venta::where('ventas.id_empresa', $empresaId)
                ->whereYear('fecha_venta', $anio)
                ->whereMonth('fecha_venta', $mes)
                ->join('clientes', 'ventas.id_cliente', '=', 'clientes.id_cliente')
                ->selectRaw("
                    clientes.nombre_razon_social as cliente,
                    COUNT(*) as cantidad_ventas,
                    COALESCE(SUM(ventas.total), 0) as total
                ")
                ->groupBy('clientes.id_cliente', 'clientes.nombre_razon_social')
                ->orderBy('total', 'DESC')
                ->limit(10)
                ->get();

            // Totales del mes anterior (para comparación)
            $mesAnterior = $mes - 1;
            $anioAnterior = $anio;
            if ($mesAnterior < 1) {
                $mesAnterior = 12;
                $anioAnterior = $anio - 1;
            }

            $totalMesAnterior = Venta::where('id_empresa', $empresaId)
                ->whereYear('fecha_venta', $anioAnterior)
                ->whereMonth('fecha_venta', $mesAnterior)
                ->selectRaw("
                    COUNT(*) as cantidad,
                    COALESCE(SUM(total), 0) as total,
                    COALESCE(SUM(t_utilidad_vent), 0) as utilidad
                ")
                ->first();

            // Resumen por forma de pago
            $porFormaPago = Venta::where('id_empresa', $empresaId)
                ->whereYear('fecha_venta', $anio)
                ->whereMonth('fecha_venta', $mes)
                ->selectRaw("
                    forma_pago,
                    COUNT(*) as cantidad,
                    COALESCE(SUM(total), 0) as total
                ")
                ->groupBy('forma_pago')
                ->orderBy('total', 'DESC')
                ->get();

            return response()->json([
                'error' => false,
                'anio' => (int) $anio,
                'mes' => (int) $mes,
                'ventas_por_dia' => $ventasPorDia,
                'total_mes' => [
                    'cantidad' => (int) $totalMes->cantidad,
                    'total' => floatval($totalMes->total),
                    'contado' => floatval($totalMes->contado),
                    'credito' => floatval($totalMes->credito),
                    'utilidad' => floatval($totalMes->utilidad),
                    'impuestos' => floatval($totalMes->impuestos),
                    'descuentos' => floatval($totalMes->descuentos),
                ],
                'mes_anterior' => [
                    'cantidad' => (int) ($totalMesAnterior->cantidad ?? 0),
                    'total' => floatval($totalMesAnterior->total ?? 0),
                    'utilidad' => floatval($totalMesAnterior->utilidad ?? 0),
                ],
                'top_clientes' => $topClientes,
                'por_forma_pago' => $porFormaPago,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => true, 'mensaje' => 'Error al generar reporte: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Ranking de clientes por ventas
     * Params: id_empresa, dias (default 90)
     */
    public function rankingClientes(Request $request)
    {
        try {
            $empresaId = $request->input('id_empresa');
            if (!$empresaId) {
                return response()->json(['error' => true, 'mensaje' => 'Debe proporcionar id_empresa'], 400);
            }

            $dias = $request->input('dias', 90);
            $fechaDesde = \Carbon\Carbon::now()->subDays($dias)->format('Y-m-d');
            $hoy = date('Y-m-d');

            // Top clientes en el periodo
            $topClientes = DB::select("
                SELECT
                    c.id_cliente,
                    c.nombre_razon_social AS nombre,
                    c.numero_documento AS documento,
                    COUNT(*) AS cantidad_ventas,
                    COALESCE(SUM(v.total), 0) AS total_compras,
                    COALESCE(SUM(v.t_utilidad_vent), 0) AS utilidad_generada,
                    ROUND(COALESCE(SUM(v.total), 0) / GREATEST(COUNT(*), 1), 2) AS ticket_promedio,
                    MAX(v.fecha_venta) AS ultima_compra,
                    DATEDIFF(?, MAX(v.fecha_venta)) AS dias_sin_comprar,
                    COALESCE(SUM(CASE WHEN v.forma_pago = 'contado' THEN v.total ELSE 0 END), 0) AS total_contado,
                    COALESCE(SUM(CASE WHEN v.forma_pago = 'credito' THEN v.total ELSE 0 END), 0) AS total_credito
                FROM ventas v
                INNER JOIN clientes c ON c.id_cliente = v.id_cliente
                WHERE v.id_empresa = ?
                  AND v.fecha_venta >= ?
                  AND v.id_cliente IS NOT NULL
                GROUP BY c.id_cliente, c.nombre_razon_social, c.numero_documento
                ORDER BY total_compras DESC
                LIMIT 50
            ", [$hoy, $empresaId, $fechaDesde]);

            // Clientes que dejaron de comprar (compraron antes del periodo pero no durante)
            $clientesInactivos = DB::select("
                SELECT
                    c.id_cliente,
                    c.nombre_razon_social AS nombre,
                    c.numero_documento AS documento,
                    COALESCE(SUM(v.total), 0) AS total_historico,
                    MAX(v.fecha_venta) AS ultima_compra,
                    DATEDIFF(?, MAX(v.fecha_venta)) AS dias_sin_comprar
                FROM ventas v
                INNER JOIN clientes c ON c.id_cliente = v.id_cliente
                WHERE v.id_empresa = ?
                  AND v.id_cliente IS NOT NULL
                  AND v.id_cliente NOT IN (
                      SELECT DISTINCT id_cliente FROM ventas
                      WHERE id_empresa = ? AND fecha_venta >= ? AND id_cliente IS NOT NULL
                  )
                GROUP BY c.id_cliente, c.nombre_razon_social, c.numero_documento
                ORDER BY total_historico DESC
                LIMIT 20
            ", [$hoy, $empresaId, $empresaId, $fechaDesde]);

            // Resumen general
            $resumen = DB::selectOne("
                SELECT
                    COUNT(DISTINCT v.id_cliente) AS clientes_activos,
                    COUNT(*) AS total_facturas,
                    COALESCE(SUM(v.total), 0) AS total_vendido,
                    ROUND(COALESCE(SUM(v.total), 0) / GREATEST(COUNT(*), 1), 2) AS ticket_promedio
                FROM ventas v
                WHERE v.id_empresa = ?
                  AND v.fecha_venta >= ?
                  AND v.id_cliente IS NOT NULL
            ", [$empresaId, $fechaDesde]);

            // Contar clientes inactivos
            $totalInactivos = count($clientesInactivos);

            return response()->json([
                'error' => false,
                'dias' => $dias,
                'top_clientes' => $topClientes,
                'clientes_inactivos' => $clientesInactivos,
                'resumen' => [
                    'total_clientes_activos' => (int) ($resumen->clientes_activos ?? 0),
                    'total_clientes_inactivos' => $totalInactivos,
                    'total_ventas_periodo' => (int) ($resumen->total_facturas ?? 0),
                    'total_monto_periodo' => floatval($resumen->total_vendido ?? 0),
                    'ticket_promedio_general' => floatval($resumen->ticket_promedio ?? 0),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => true, 'mensaje' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Comparativo de ventas entre periodos + ventas por día de semana
     * Params: id_empresa, anio (default actual), mes (default actual)
     */
    public function comparativo(Request $request)
    {
        try {
            $empresaId = $request->input('id_empresa');
            if (!$empresaId) {
                return response()->json(['error' => true, 'mensaje' => 'Debe proporcionar id_empresa'], 400);
            }

            $anio = (int) $request->input('anio', date('Y'));
            $mes = (int) $request->input('mes', date('n'));
            $anioAnterior = $anio - 1;

            // Mes anterior
            $mesAnt = $mes - 1;
            $anioMesAnt = $anio;
            if ($mesAnt < 1) { $mesAnt = 12; $anioMesAnt = $anio - 1; }

            // Helper para obtener totales de un mes
            $getTotalesMes = function ($anioQ, $mesQ) use ($empresaId) {
                return DB::selectOne("
                    SELECT
                        COUNT(*) AS cantidad,
                        COALESCE(SUM(total), 0) AS total,
                        COALESCE(SUM(t_utilidad_vent), 0) AS utilidad,
                        COALESCE(SUM(CASE WHEN forma_pago = 'contado' THEN total ELSE 0 END), 0) AS contado,
                        COALESCE(SUM(CASE WHEN forma_pago = 'credito' THEN total ELSE 0 END), 0) AS credito,
                        COUNT(DISTINCT id_cliente) AS clientes
                    FROM ventas
                    WHERE id_empresa = ? AND YEAR(fecha_venta) = ? AND MONTH(fecha_venta) = ?
                ", [$empresaId, $anioQ, $mesQ]);
            };

            $mesActual = $getTotalesMes($anio, $mes);
            $mesAnterior = $getTotalesMes($anioMesAnt, $mesAnt);
            $mismoMesAnioAnt = $getTotalesMes($anioAnterior, $mes);

            // Totales anuales
            $getTotalesAnio = function ($anioQ) use ($empresaId) {
                return DB::selectOne("
                    SELECT
                        COUNT(*) AS cantidad,
                        COALESCE(SUM(total), 0) AS total,
                        COALESCE(SUM(t_utilidad_vent), 0) AS utilidad,
                        COALESCE(SUM(CASE WHEN forma_pago = 'contado' THEN total ELSE 0 END), 0) AS contado,
                        COALESCE(SUM(CASE WHEN forma_pago = 'credito' THEN total ELSE 0 END), 0) AS credito
                    FROM ventas
                    WHERE id_empresa = ? AND YEAR(fecha_venta) = ?
                ", [$empresaId, $anioQ]);
            };

            $totAnioActual = $getTotalesAnio($anio);
            $totAnioAnterior = $getTotalesAnio($anioAnterior);

            // Ventas mensuales para gráfico comparativo (12 meses año actual vs anterior)
            $nombresMeses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            $mensuales = [];
            for ($m = 1; $m <= 12; $m++) {
                $act = $getTotalesMes($anio, $m);
                $ant = $getTotalesMes($anioAnterior, $m);
                $mensuales[] = [
                    'mes' => $m,
                    'mes_nombre' => $nombresMeses[$m],
                    'total_actual' => floatval($act->total ?? 0),
                    'total_anterior' => floatval($ant->total ?? 0),
                    'utilidad_actual' => floatval($act->utilidad ?? 0),
                    'cantidad_actual' => (int) ($act->cantidad ?? 0),
                ];
            }

            // Ventas por día de la semana (últimos 90 días)
            $hace90 = \Carbon\Carbon::now()->subDays(90)->format('Y-m-d');
            $porDiaSemana = DB::select("
                SELECT
                    DAYOFWEEK(fecha_venta) AS dia_num,
                    CASE DAYOFWEEK(fecha_venta)
                        WHEN 1 THEN 'Domingo'
                        WHEN 2 THEN 'Lunes'
                        WHEN 3 THEN 'Martes'
                        WHEN 4 THEN 'Miércoles'
                        WHEN 5 THEN 'Jueves'
                        WHEN 6 THEN 'Viernes'
                        WHEN 7 THEN 'Sábado'
                    END AS dia,
                    COUNT(*) AS cantidad,
                    COALESCE(SUM(total), 0) AS total,
                    ROUND(COALESCE(SUM(total), 0) / GREATEST(COUNT(DISTINCT DATE(fecha_venta)), 1), 2) AS promedio_diario
                FROM ventas
                WHERE id_empresa = ? AND fecha_venta >= ?
                GROUP BY dia_num, dia
                ORDER BY dia_num
            ", [$empresaId, $hace90]);

            // Ventas por forma de pago (mes actual)
            $porFormaPago = DB::select("
                SELECT
                    forma_pago,
                    COUNT(*) AS cantidad,
                    COALESCE(SUM(total), 0) AS total
                FROM ventas
                WHERE id_empresa = ? AND YEAR(fecha_venta) = ? AND MONTH(fecha_venta) = ?
                GROUP BY forma_pago
                ORDER BY total DESC
            ", [$empresaId, $anio, $mes]);

            return response()->json([
                'error' => false,
                'anio' => $anio,
                'mes' => $mes,
                'mes_actual' => [
                    'cantidad' => (int) ($mesActual->cantidad ?? 0),
                    'total' => floatval($mesActual->total ?? 0),
                    'utilidad' => floatval($mesActual->utilidad ?? 0),
                    'contado' => floatval($mesActual->contado ?? 0),
                    'credito' => floatval($mesActual->credito ?? 0),
                    'clientes' => (int) ($mesActual->clientes ?? 0),
                ],
                'mes_anterior' => [
                    'cantidad' => (int) ($mesAnterior->cantidad ?? 0),
                    'total' => floatval($mesAnterior->total ?? 0),
                    'utilidad' => floatval($mesAnterior->utilidad ?? 0),
                    'contado' => floatval($mesAnterior->contado ?? 0),
                    'credito' => floatval($mesAnterior->credito ?? 0),
                ],
                'mismo_mes_anio_anterior' => [
                    'cantidad' => (int) ($mismoMesAnioAnt->cantidad ?? 0),
                    'total' => floatval($mismoMesAnioAnt->total ?? 0),
                    'utilidad' => floatval($mismoMesAnioAnt->utilidad ?? 0),
                    'contado' => floatval($mismoMesAnioAnt->contado ?? 0),
                    'credito' => floatval($mismoMesAnioAnt->credito ?? 0),
                ],
                'anio_actual' => [
                    'cantidad' => (int) ($totAnioActual->cantidad ?? 0),
                    'total' => floatval($totAnioActual->total ?? 0),
                    'utilidad' => floatval($totAnioActual->utilidad ?? 0),
                    'contado' => floatval($totAnioActual->contado ?? 0),
                    'credito' => floatval($totAnioActual->credito ?? 0),
                ],
                'anio_anterior' => [
                    'cantidad' => (int) ($totAnioAnterior->cantidad ?? 0),
                    'total' => floatval($totAnioAnterior->total ?? 0),
                    'utilidad' => floatval($totAnioAnterior->utilidad ?? 0),
                    'contado' => floatval($totAnioAnterior->contado ?? 0),
                    'credito' => floatval($totAnioAnterior->credito ?? 0),
                ],
                'mensuales' => $mensuales,
                'por_dia_semana' => $porDiaSemana,
                'por_forma_pago' => $porFormaPago,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => true, 'mensaje' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Mapear forma de pago desde VB6
     */
    private function mapearFormaPago($tipo, $idMedioPago)
    {
        // Quitar acentos y normalizar
        $tipo = strtoupper(trim($tipo ?? ''));
        $tipo = str_replace(
            ['Á','É','Í','Ó','Ú','á','é','í','ó','ú'],
            ['A','E','I','O','U','A','E','I','O','U'],
            $tipo
        );

        if ($tipo == 'CONTADO' || $tipo == 'C') {
            return 'contado';
        } elseif ($tipo == 'CREDITO' || $tipo == 'CR') {
            return 'credito';
        }

        // Mapeo por id_mediopago si existe
        switch ($idMedioPago) {
            case 1:
                return 'efectivo';
            case 2:
                return 'tarjeta';
            case 3:
                return 'transferencia';
            case 4:
                return 'credito';
            default:
                return 'efectivo';
        }
    }

    /**
     * Mapear estado de factura desde VB6
     */
    private function mapearEstado($estadoFact, $pagada)
    {
        // Estados: 1=Pendiente, 2=Pagada, 3=Anulada (ajusta según tu tabla estados_factura)
        if (strtoupper($estadoFact) == 'ANULADA' || $estadoFact == 'A') {
            return 3; // Anulada
        }

        if (strtoupper($pagada) == 'S' || $pagada == '1' || strtoupper($pagada) == 'SI') {
            return 2; // Pagada
        }

        return 1; // Pendiente
    }

    /**
     * Parsear fecha desde VB6 (puede venir en varios formatos)
     */
    private function parsearFecha($fecha)
    {
        if (empty($fecha)) {
            \Log::warning('SYNC_VENTA: Fecha vacía, usando fecha actual');
            return date('Y-m-d');
        }

        // Limpiar espacios y trim
        $fecha = trim($fecha);

        // Si viene con hora (DATETIME de MySQL JSON_OBJECT): "2026-03-05 00:00:00" o "2026-03-05 00:00:00.000000"
        // Extraer solo la parte de fecha
        if (preg_match('/^(\d{4}-\d{2}-\d{2})[\sT]/', $fecha, $matches)) {
            return $matches[1];
        }

        // Intentar varios formatos
        $formatos = ['Y-m-d', 'Y-m-d H:i:s', 'Y-m-d H:i:s.u', 'd/m/Y', 'm/d/Y', 'd-m-Y', 'Y/m/d'];

        foreach ($formatos as $formato) {
            $parsed = \DateTime::createFromFormat($formato, $fecha);
            if ($parsed !== false) {
                return $parsed->format('Y-m-d');
            }
        }

        // Fallback con strtotime
        $timestamp = strtotime($fecha);
        if ($timestamp !== false) {
            return date('Y-m-d', $timestamp);
        }

        // Si no se puede parsear, usar fecha actual y loguear
        \Log::warning('SYNC_VENTA: No se pudo parsear fecha', ['fecha_original' => $fecha]);
        return date('Y-m-d');
    }

    /**
     * Procesar un detalle de venta desde VB6
     */
    private function procesarDetalle($venta, $detalle, $idEmpresa)
    {
        // Buscar producto por código VB6 (Items es el código del producto)
        $producto = null;
        $codigoProducto = $detalle['Items'] ?? $detalle['CodigoArt'] ?? $detalle['codigo'] ?? $detalle['Codigo'] ?? null;

        if ($codigoProducto) {
            $producto = Producto::where('id_empresa', $idEmpresa)
                                ->where('codvb6', $codigoProducto)
                                ->first();

            // Fallback: buscar por código de producto
            if (!$producto) {
                $producto = Producto::where('id_empresa', $idEmpresa)
                                    ->where('codigo_pro', $codigoProducto)
                                    ->first();
            }
        }

        // Campos de VB6
        $descripcionTemp = $detalle['DescripcionTemp'] ?? $detalle['descripcion'] ?? null;
        $cantidad = floatval($detalle['Cantidad'] ?? $detalle['cantidad'] ?? 1);
        $cantidadDevolucion = floatval($detalle['Dev'] ?? $detalle['devolucion'] ?? 0);
        $precioCosto = floatval($detalle['PrecioC'] ?? $detalle['precio_costo'] ?? 0);
        $precioVenta = floatval($detalle['PrecioV'] ?? $detalle['Precio'] ?? $detalle['precio'] ?? 0);
        $impuesto = floatval($detalle['Impuesto'] ?? $detalle['impuesto'] ?? 0);
        $porcentajeIva = floatval($detalle['IVA'] ?? $detalle['iva'] ?? $detalle['porcentaje_iva'] ?? 0);
        $subtotal = floatval($detalle['Subtotal'] ?? $detalle['subtotal'] ?? 0);
        $descuento = floatval($detalle['Descuento'] ?? $detalle['descuento'] ?? 0);
        $total = floatval($detalle['Total'] ?? $detalle['total'] ?? 0);

        // Calcular subtotal si no viene
        if ($subtotal == 0) {
            $subtotal = ($cantidad * $precioVenta) - $descuento;
        }

        // Si no viene el total, calcularlo
        if ($total == 0) {
            $total = $subtotal + $impuesto;
        }

        // nombre_producto: siempre guarda el nombre original del producto (para histórico)
        // descripcion_temp: descripción personalizada para servicios (se muestra en lugar del nombre)
        $nombreProducto = $producto ? $producto->nombre_pro : null;

        VentaDetalle::create([
            'id_venta' => $venta->id_venta,
            'id_producto' => $producto ? $producto->id_producto : null,
            'codvb6_producto' => $codigoProducto,
            'descripcion_temp' => $descripcionTemp,
            'nombre_producto' => $nombreProducto,
            'cantidad' => $cantidad,
            'cantidad_devolucion' => $cantidadDevolucion,
            'precio_unitario' => $precioVenta,
            'precio_costo' => $precioCosto,
            'subtotal' => $subtotal,
            'descuento' => $descuento,
            'impuesto' => $impuesto,
            'porcentaje_iva' => $porcentajeIva,
            'total' => $total
        ]);
    }
}
