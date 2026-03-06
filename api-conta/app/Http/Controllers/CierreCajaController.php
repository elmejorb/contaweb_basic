<?php

namespace App\Http\Controllers;

use App\Models\CierreCaja;
use App\Models\MovimientoCaja;
use App\Models\Empresa;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Carbon\Carbon;

class CierreCajaController extends Controller
{
    /**
     * Listar cierres de caja
     */
    public function index(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $query = CierreCaja::with(['usuario', 'aprobador']);

            // Filtro por empresa
            if ($request->has('id_empresa')) {
                $query->where('id_empresa', $request->id_empresa);
            }

            // Filtro por usuario/vendedor
            if ($request->has('id_usuario')) {
                $query->where('id_usuario', $request->id_usuario);
            }

            // Filtro por fecha específica
            if ($request->has('fecha')) {
                $query->whereDate('fecha', $request->fecha);
            }

            // Filtro por rango de fechas
            if ($request->has('fecha_desde')) {
                $query->whereDate('fecha', '>=', $request->fecha_desde);
            }
            if ($request->has('fecha_hasta')) {
                $query->whereDate('fecha', '<=', $request->fecha_hasta);
            }

            // Filtro por estado
            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            // Filtro por origen (web o vb6)
            if ($request->has('origen')) {
                if ($request->origen === 'vb6') {
                    $query->whereNotNull('codvb6');
                } elseif ($request->origen === 'web') {
                    $query->whereNull('codvb6');
                }
            }

            // Ordenamiento
            $sortBy = $request->get('sortBy', 'fecha');
            $sortOrder = $request->get('sortOrder', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginación
            $perPage = $request->get('perPage', 10);
            $cierres = $query->paginate($perPage);

            return response()->json([
                'error' => false,
                'cierres' => $cierres->items(),
                'total' => $cierres->total(),
                'per_page' => $cierres->perPage(),
                'current_page' => $cierres->currentPage(),
                'last_page' => $cierres->lastPage()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener cierres de caja: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ver un cierre específico
     */
    public function show($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $cierre = CierreCaja::with(['usuario', 'aprobador', 'empresa'])->findOrFail($id);

            return response()->json([
                'error' => false,
                'cierre' => $cierre
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Cierre de caja no encontrado'
            ], 404);
        }
    }

    /**
     * Crear un nuevo cierre de caja
     */
    public function store(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $validator = Validator::make($request->all(), [
                'id_empresa' => 'required|exists:empresas,id_empresa',
                'fecha' => 'required|date',
                'id_usuario' => 'nullable|exists:usuarios,id_usuario'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Error de validación',
                    'errores' => $validator->errors()
                ], 422);
            }

            $cierre = CierreCaja::create([
                'id_empresa' => $request->id_empresa,
                'id_usuario' => $request->id_usuario,
                'fecha' => $request->fecha,
                'base_inicial' => $request->base_inicial ?? 0,
                'estado' => 0 // Abierto
            ]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Cierre de caja creado exitosamente',
                'cierre' => $cierre
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear cierre de caja: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un cierre de caja
     */
    public function update(Request $request, $id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $cierre = CierreCaja::findOrFail($id);

            if (!$cierre->esEditable()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Este cierre de caja no puede ser editado (estado: ' . $cierre->estado_nombre . ')'
                ], 422);
            }

            $cierre->update($request->only([
                'base_inicial', 'base_siguiente', 'arqueo_billetes', 'arqueo_monedas',
                'arqueo_cheques', 'arqueo_total', 'saldo_libros', 'diferencia',
                'ventas_contado', 'ventas_credito', 'ventas_tarjeta', 'ventas_transferencia',
                'ventas_nequi', 'pagos_clientes', 'otros_ingresos', 'egresos',
                'devoluciones_ventas', 'devoluciones_compras', 'pagos_proveedores',
                'separados', 'total_efectivo', 'total_venta_dia', 'valor_inventario',
                'observaciones'
            ]));

            return response()->json([
                'error' => false,
                'mensaje' => 'Cierre de caja actualizado',
                'cierre' => $cierre
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar cierre de caja: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cerrar un cierre de caja
     */
    public function cerrar(Request $request, $id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $cierre = CierreCaja::findOrFail($id);

            if ($cierre->estado != 0) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Este cierre ya fue procesado'
                ], 422);
            }

            $cierre->update([
                'estado' => 1,
                'fecha_cierre' => Carbon::now()
            ]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Cierre de caja cerrado exitosamente',
                'cierre' => $cierre
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cerrar caja: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Aprobar un cierre de caja (solo admin)
     */
    public function aprobar(Request $request, $id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $cierre = CierreCaja::findOrFail($id);

            if ($cierre->estado != 1) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Solo se pueden aprobar cierres que estén cerrados'
                ], 422);
            }

            $cierre->update([
                'estado' => 2,
                'aprobado_por' => $usuario->id_usuario,
                'fecha_aprobacion' => Carbon::now()
            ]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Cierre de caja aprobado',
                'cierre' => $cierre
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al aprobar cierre: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resumen de cierres por vendedor en un rango de fechas
     */
    public function resumenPorVendedor(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $validator = Validator::make($request->all(), [
                'id_empresa' => 'required|exists:empresas,id_empresa',
                'fecha_desde' => 'required|date',
                'fecha_hasta' => 'required|date'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Error de validación',
                    'errores' => $validator->errors()
                ], 422);
            }

            $resumen = CierreCaja::where('id_empresa', $request->id_empresa)
                ->whereDate('fecha', '>=', $request->fecha_desde)
                ->whereDate('fecha', '<=', $request->fecha_hasta)
                ->select(
                    'id_usuario',
                    DB::raw('COUNT(*) as total_cierres'),
                    DB::raw('SUM(ventas_contado) as total_ventas_contado'),
                    DB::raw('SUM(ventas_credito) as total_ventas_credito'),
                    DB::raw('SUM(ventas_tarjeta) as total_ventas_tarjeta'),
                    DB::raw('SUM(ventas_transferencia) as total_ventas_transferencia'),
                    DB::raw('SUM(ventas_nequi) as total_ventas_nequi'),
                    DB::raw('SUM(total_venta_dia) as total_ventas'),
                    DB::raw('SUM(diferencia) as total_diferencias'),
                    DB::raw('SUM(egresos) as total_egresos')
                )
                ->groupBy('id_usuario')
                ->with('usuario')
                ->get();

            return response()->json([
                'error' => false,
                'resumen' => $resumen
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener resumen: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recibir cierre de caja desde VB6
     */
    public function recibirDesdeVB6(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'token_api' => 'required|string',
                'Cod_ControlCaja' => 'required'
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

            // Parsear fecha
            $fecha = null;
            if (!empty($request->Fecha)) {
                try {
                    $fecha = Carbon::createFromFormat('d/m/Y', $request->Fecha)->format('Y-m-d');
                } catch (\Exception $e) {
                    try {
                        $fecha = Carbon::parse($request->Fecha)->format('Y-m-d');
                    } catch (\Exception $e) {
                        $fecha = Carbon::now()->format('Y-m-d');
                    }
                }
            } else {
                $fecha = Carbon::now()->format('Y-m-d');
            }

            // Parsear fecha de cierre
            $fechaCierre = null;
            if (!empty($request->FechaCierre)) {
                try {
                    $fechaCierre = Carbon::parse($request->FechaCierre);
                } catch (\Exception $e) {
                    $fechaCierre = null;
                }
            }

            // Buscar cierre existente por codvb6
            $cierre = CierreCaja::where('id_empresa', $empresa->id_empresa)
                                ->where('codvb6', $request->Cod_ControlCaja)
                                ->first();

            // Obtener valores numéricos para calcular totales
            $ventasContado = floatval($request->VContado ?? 0);
            $ventasCredito = floatval($request->VCredito ?? 0);
            $pagosClientes = floatval($request->Pagos ?? 0);
            $valorTotal = floatval($request->ValorTotal ?? 0);
            $baseInicial = floatval($request->ValorInicialCaja ?? 0);
            $egresos = floatval($request->Egresos ?? 0);

            // Calcular totales
            $totalVentaDia = $ventasContado + $ventasCredito;
            $totalEfectivo = $baseInicial + $ventasContado + $pagosClientes - $egresos;

            $datosCierre = [
                'fecha' => $fecha,
                'fecha_cierre' => $fechaCierre,
                'base_inicial' => $baseInicial,
                'base_siguiente' => $request->Base ?? 0,
                'arqueo_billetes' => $request->Villetes ?? 0,
                'arqueo_monedas' => $request->Monedas ?? 0,
                'arqueo_cheques' => $request->Cheques ?? 0,
                'arqueo_total' => $valorTotal,
                'saldo_libros' => $request->SaldoEnLibros ?? 0,
                'diferencia' => $request->Diferencia ?? 0,
                'ventas_contado' => $ventasContado,
                'ventas_credito' => $ventasCredito,
                'pagos_clientes' => $pagosClientes,
                'egresos' => $egresos,
                'valor_inventario' => $request->VInventario ?? 0,
                'total_venta_dia' => $totalVentaDia,
                'total_efectivo' => $totalEfectivo,
                'estado' => $request->Estado ?? 0,
                'id_usuario' => $request->Id_Usuario ?? null
            ];

            if ($cierre) {
                $cierre->update($datosCierre);

                return response()->json([
                    'error' => false,
                    'mensaje' => 'Cierre de caja actualizado desde VB6',
                    'accion' => 'actualizado',
                    'cierre' => $cierre
                ]);
            } else {
                $datosCierre['id_empresa'] = $empresa->id_empresa;
                $datosCierre['codvb6'] = $request->Cod_ControlCaja;

                $cierre = CierreCaja::create($datosCierre);

                return response()->json([
                    'error' => false,
                    'mensaje' => 'Cierre de caja creado desde VB6',
                    'accion' => 'creado',
                    'cierre' => $cierre
                ], 201);
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al recibir cierre desde VB6: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener caja activa (abierta) del usuario actual
     */
    public function cajaActiva(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $query = CierreCaja::where('estado', 0); // Abierto

            if ($request->has('id_empresa')) {
                $query->where('id_empresa', $request->id_empresa);
            }

            // Buscar caja del usuario actual o caja general (sin usuario asignado)
            $query->where(function($q) use ($usuario) {
                $q->where('id_usuario', $usuario->id_usuario)
                  ->orWhereNull('id_usuario');
            });

            $cajaActiva = $query->with(['usuario', 'empresa'])->first();

            return response()->json([
                'error' => false,
                'caja_abierta' => $cajaActiva !== null,
                'caja' => $cajaActiva
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener caja activa: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Abrir una nueva caja
     */
    public function abrirCaja(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $validator = Validator::make($request->all(), [
                'id_empresa' => 'required|exists:empresas,id_empresa',
                'base_inicial' => 'required|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Error de validación',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Verificar si ya hay una caja abierta para este usuario/empresa
            $cajaExistente = CierreCaja::where('id_empresa', $request->id_empresa)
                ->where('estado', 0)
                ->where(function($q) use ($usuario) {
                    $q->where('id_usuario', $usuario->id_usuario)
                      ->orWhereNull('id_usuario');
                })
                ->first();

            if ($cajaExistente) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Ya existe una caja abierta. Debe cerrarla antes de abrir una nueva.',
                    'caja' => $cajaExistente
                ], 422);
            }

            $cierre = CierreCaja::create([
                'id_empresa' => $request->id_empresa,
                'id_usuario' => $usuario->id_usuario,
                'fecha' => Carbon::now()->format('Y-m-d'),
                'base_inicial' => $request->base_inicial,
                'estado' => 0 // Abierto
            ]);

            $cierre->load(['usuario', 'empresa']);

            return response()->json([
                'error' => false,
                'mensaje' => 'Caja abierta exitosamente',
                'caja' => $cierre
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al abrir caja: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cerrar caja con arqueo completo
     */
    public function cerrarCajaCompleto(Request $request, $id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $cierre = CierreCaja::findOrFail($id);

            if ($cierre->estado != 0) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Esta caja ya fue cerrada'
                ], 422);
            }

            // Validar datos del arqueo
            $validator = Validator::make($request->all(), [
                'arqueo_billetes' => 'required|numeric|min:0',
                'arqueo_monedas' => 'required|numeric|min:0',
                'arqueo_cheques' => 'numeric|min:0',
                'base_siguiente' => 'required|numeric|min:0',
                'observaciones' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Error de validación',
                    'errores' => $validator->errors()
                ], 422);
            }

            $arqueoTotal = ($request->arqueo_billetes ?? 0) +
                          ($request->arqueo_monedas ?? 0) +
                          ($request->arqueo_cheques ?? 0);

            // Calcular saldo en libros desde movimientos si existen
            $movimientos = MovimientoCaja::where('id_cierre', $id)->get();
            $entradas = $movimientos->where('tipo', 'entrada')->sum('monto');
            $salidas = $movimientos->where('tipo', 'salida')->sum('monto');
            $saldoLibros = $cierre->base_inicial + $entradas - $salidas;

            $diferencia = $arqueoTotal - $saldoLibros;

            $cierre->update([
                'arqueo_billetes' => $request->arqueo_billetes,
                'arqueo_monedas' => $request->arqueo_monedas,
                'arqueo_cheques' => $request->arqueo_cheques ?? 0,
                'arqueo_total' => $arqueoTotal,
                'saldo_libros' => $saldoLibros,
                'diferencia' => $diferencia,
                'base_siguiente' => $request->base_siguiente,
                'total_efectivo' => $arqueoTotal,
                'observaciones' => $request->observaciones,
                'estado' => 1, // Cerrado
                'fecha_cierre' => Carbon::now()
            ]);

            $cierre->load(['usuario', 'empresa']);

            return response()->json([
                'error' => false,
                'mensaje' => 'Caja cerrada exitosamente',
                'cierre' => $cierre
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cerrar caja: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==================== MOVIMIENTOS DE CAJA ====================

    /**
     * Listar movimientos de caja
     */
    public function listarMovimientos(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $query = MovimientoCaja::with(['usuario', 'cierre']);

            if ($request->has('id_empresa')) {
                $query->where('id_empresa', $request->id_empresa);
            }

            if ($request->has('id_cierre')) {
                $query->where('id_cierre', $request->id_cierre);
            }

            if ($request->has('tipo')) {
                $query->where('tipo', $request->tipo);
            }

            if ($request->has('fecha_desde')) {
                $query->whereDate('created_at', '>=', $request->fecha_desde);
            }

            if ($request->has('fecha_hasta')) {
                $query->whereDate('created_at', '<=', $request->fecha_hasta);
            }

            $sortBy = $request->get('sortBy', 'created_at');
            $sortOrder = $request->get('sortOrder', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $perPage = $request->get('perPage', 20);
            $movimientos = $query->paginate($perPage);

            return response()->json([
                'error' => false,
                'movimientos' => $movimientos->items(),
                'total' => $movimientos->total(),
                'per_page' => $movimientos->perPage(),
                'current_page' => $movimientos->currentPage(),
                'last_page' => $movimientos->lastPage()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener movimientos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un movimiento de caja (entrada o salida)
     */
    public function crearMovimiento(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $validator = Validator::make($request->all(), [
                'id_empresa' => 'required|exists:empresas,id_empresa',
                'tipo' => 'required|in:entrada,salida',
                'concepto' => 'required|string|max:255',
                'monto' => 'required|numeric|min:0.01'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Error de validación',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Buscar caja activa
            $cajaActiva = CierreCaja::where('id_empresa', $request->id_empresa)
                ->where('estado', 0)
                ->where(function($q) use ($usuario) {
                    $q->where('id_usuario', $usuario->id_usuario)
                      ->orWhereNull('id_usuario');
                })
                ->first();

            if (!$cajaActiva) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'No hay una caja abierta. Debe abrir la caja antes de registrar movimientos.'
                ], 422);
            }

            $movimiento = MovimientoCaja::create([
                'id_empresa' => $request->id_empresa,
                'id_usuario' => $usuario->id_usuario,
                'id_cierre' => $cajaActiva->id_cierre,
                'tipo' => $request->tipo,
                'concepto' => $request->concepto,
                'monto' => $request->monto,
                'referencia' => $request->referencia ?? null,
                'observaciones' => $request->observaciones ?? null
            ]);

            $movimiento->load(['usuario', 'cierre']);

            return response()->json([
                'error' => false,
                'mensaje' => 'Movimiento registrado exitosamente',
                'movimiento' => $movimiento
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear movimiento: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Anular un movimiento de caja
     */
    public function anularMovimiento($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $movimiento = MovimientoCaja::findOrFail($id);

            // Verificar que la caja esté abierta
            if ($movimiento->cierre && $movimiento->cierre->estado != 0) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'No se puede anular un movimiento de una caja cerrada'
                ], 422);
            }

            $movimiento->update(['anulado' => true]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Movimiento anulado exitosamente',
                'movimiento' => $movimiento
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al anular movimiento: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resumen de caja actual (balance, movimientos del día)
     */
    public function resumenCajaActual(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            if (!$request->has('id_empresa')) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Se requiere id_empresa'
                ], 422);
            }

            // Buscar caja activa
            $cajaActiva = CierreCaja::where('id_empresa', $request->id_empresa)
                ->where('estado', 0)
                ->where(function($q) use ($usuario) {
                    $q->where('id_usuario', $usuario->id_usuario)
                      ->orWhereNull('id_usuario');
                })
                ->with(['usuario', 'empresa'])
                ->first();

            if (!$cajaActiva) {
                return response()->json([
                    'error' => false,
                    'caja_abierta' => false,
                    'mensaje' => 'No hay caja abierta'
                ]);
            }

            // Obtener movimientos de esta caja
            $movimientos = MovimientoCaja::where('id_cierre', $cajaActiva->id_cierre)
                ->where('anulado', false)
                ->get();

            $totalEntradas = $movimientos->where('tipo', 'entrada')->sum('monto');
            $totalSalidas = $movimientos->where('tipo', 'salida')->sum('monto');
            $saldoActual = $cajaActiva->base_inicial + $totalEntradas - $totalSalidas;

            return response()->json([
                'error' => false,
                'caja_abierta' => true,
                'caja' => $cajaActiva,
                'resumen' => [
                    'base_inicial' => $cajaActiva->base_inicial,
                    'total_entradas' => $totalEntradas,
                    'total_salidas' => $totalSalidas,
                    'saldo_actual' => $saldoActual,
                    'cantidad_movimientos' => $movimientos->count()
                ],
                'ultimos_movimientos' => MovimientoCaja::where('id_cierre', $cajaActiva->id_cierre)
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener resumen: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recibir lote de cierres de caja desde VB6
     */
    public function recibirLoteDesdeVB6(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'token_api' => 'required|string',
                'registros' => 'required|array|min:1|max:100'
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

            $registros = $request->registros;
            $insertados = 0;
            $actualizados = 0;
            $errores = [];

            foreach ($registros as $index => $data) {
                try {
                    if (empty($data['Cod_ControlCaja'])) {
                        $errores[] = "Registro $index: Falta Cod_ControlCaja";
                        continue;
                    }

                    // Parsear fecha
                    $fecha = Carbon::now()->format('Y-m-d');
                    if (!empty($data['Fecha'])) {
                        try {
                            $fecha = Carbon::createFromFormat('d/m/Y', $data['Fecha'])->format('Y-m-d');
                        } catch (\Exception $e) {
                            try {
                                $fecha = Carbon::parse($data['Fecha'])->format('Y-m-d');
                            } catch (\Exception $e) {
                                // Mantener fecha actual
                            }
                        }
                    }

                    // Parsear fecha de cierre
                    $fechaCierre = null;
                    if (!empty($data['FechaCierre'])) {
                        try {
                            $fechaCierre = Carbon::parse($data['FechaCierre']);
                        } catch (\Exception $e) {
                            $fechaCierre = null;
                        }
                    }

                    // Obtener valores numéricos para calcular totales
                    $ventasContado = floatval($data['VContado'] ?? 0);
                    $ventasCredito = floatval($data['VCredito'] ?? 0);
                    $pagosClientes = floatval($data['Pagos'] ?? 0);
                    $valorTotal = floatval($data['ValorTotal'] ?? 0);
                    $baseInicial = floatval($data['ValorInicialCaja'] ?? $data['ValorInicalCaja'] ?? 0);
                    $egresos = floatval($data['Egresos'] ?? 0);

                    // Calcular total_venta_dia = ventas contado + ventas crédito
                    $totalVentaDia = $ventasContado + $ventasCredito;

                    // Calcular total_efectivo = base inicial + ventas contado + pagos clientes - egresos
                    $totalEfectivo = $baseInicial + $ventasContado + $pagosClientes - $egresos;

                    $datosCierre = [
                        'fecha' => $fecha,
                        'fecha_cierre' => $fechaCierre,
                        'base_inicial' => $baseInicial,
                        'base_siguiente' => $data['Base'] ?? 0,
                        'arqueo_billetes' => $data['Villetes'] ?? 0,
                        'arqueo_monedas' => $data['Monedas'] ?? 0,
                        'arqueo_cheques' => $data['Cheques'] ?? 0,
                        'arqueo_total' => $valorTotal,
                        'saldo_libros' => $data['SaldoEnLibros'] ?? 0,
                        'diferencia' => $data['Diferencia'] ?? 0,
                        'ventas_contado' => $ventasContado,
                        'ventas_credito' => $ventasCredito,
                        'pagos_clientes' => $pagosClientes,
                        'egresos' => $egresos,
                        'valor_inventario' => $data['VInventario'] ?? 0,
                        'total_venta_dia' => $totalVentaDia,
                        'total_efectivo' => $totalEfectivo,
                        'estado' => $data['Estado'] ?? 0,
                        'id_usuario' => $data['Id_Usuario'] ?? null
                    ];

                    $cierre = CierreCaja::where('id_empresa', $empresa->id_empresa)
                                        ->where('codvb6', $data['Cod_ControlCaja'])
                                        ->first();

                    if ($cierre) {
                        $cierre->update($datosCierre);
                        $actualizados++;
                    } else {
                        $datosCierre['id_empresa'] = $empresa->id_empresa;
                        $datosCierre['codvb6'] = $data['Cod_ControlCaja'];
                        CierreCaja::create($datosCierre);
                        $insertados++;
                    }
                } catch (\Exception $e) {
                    $errores[] = "Registro {$data['Cod_ControlCaja']}: " . $e->getMessage();
                }
            }

            return response()->json([
                'error' => false,
                'mensaje' => 'Lote procesado correctamente',
                'insertados' => $insertados,
                'actualizados' => $actualizados,
                'total_procesados' => $insertados + $actualizados,
                'total_errores' => count($errores),
                'errores' => $errores
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al procesar lote de cierres: ' . $e->getMessage()
            ], 500);
        }
    }
}
