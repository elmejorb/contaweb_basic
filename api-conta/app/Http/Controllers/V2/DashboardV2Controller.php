<?php

namespace App\Http\Controllers\V2;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\V2\AuthV2Controller;

/**
 * Dashboard mobile — pensado para que el dueño del negocio vea desde su
 * celular los números clave sin loguearse al admin completo.
 *
 * Auth: email + token_api por query string (vista magic-link read-only).
 * Todas las queries son solo lectura. El id_empresa viene resuelto del token.
 */
class DashboardV2Controller extends Controller
{
    /**
     * Autentica el request. Dos modos soportados (en orden de prioridad):
     *
     *   MODO USUARIO (nuevo, multi-empresa):
     *     ?token=<token_us del usuario>
     *     ?empresa_id=X (opcional — si no, usa la primera vinculada)
     *     Devuelve TODAS las empresas que el usuario tiene vinculadas.
     *
     *   MODO EMPRESA (legacy magic-link):
     *     ?email=<email de la empresa>&token_api=<token_crm>
     *     Devuelve solo esa empresa.
     *
     * Retorna [Empresa|null, array $empresasElegibles].
     */
    private function autenticar(Request $request): array
    {
        $empresaIdPedida = (int) $request->query('empresa_id', 0);

        // MODO USUARIO
        $tokenUser = $request->query('token') ?: $request->header('X-Session-Token');
        if ($tokenUser) {
            $u = DB::table('usuarios')->where('token_us', $tokenUser)->first();
            if (!$u) return [null, []];
            $elegibles = AuthV2Controller::empresasDelUsuario($u->id_usuario);
            if (empty($elegibles)) return [null, []];
            // Elegir la empresa pedida o la primera
            $empresa = null;
            if ($empresaIdPedida) {
                foreach ($elegibles as $e) {
                    if ((int) ($e->id_empresa ?? $e['id_empresa'] ?? 0) === $empresaIdPedida) {
                        $empresa = Empresa::find($empresaIdPedida);
                        break;
                    }
                }
            }
            if (!$empresa) {
                $primera = $elegibles[0];
                $empresa = Empresa::find($primera->id_empresa ?? $primera['id_empresa']);
            }
            return [$empresa, $elegibles];
        }

        // MODO EMPRESA (compat)
        $empresa = Empresa::where('email_empresa', $request->query('email'))
            ->where('token_crm', $request->query('token_api'))
            ->first();
        if (!$empresa) return [null, []];
        $elegibles = Empresa::where('email_empresa', $empresa->email_empresa)
            ->get(['id_empresa', 'nombre_empresa', 'nit_empresa'])
            ->toArray();
        if ($empresaIdPedida) {
            foreach ($elegibles as $e) {
                if ((int) ($e['id_empresa'] ?? 0) === $empresaIdPedida) {
                    $empresa = Empresa::find($empresaIdPedida);
                    break;
                }
            }
        }
        return [$empresa, $elegibles];
    }

    public function resumen(Request $request): JsonResponse
    {
        [$empresa, $elegibles] = $this->autenticar($request);
        if (!$empresa) {
            return response()->json(['ok' => false, 'error' => 'auth'], 401);
        }
        $empresaId = $empresa->id_empresa;
        $hoy = Carbon::today();
        $inicioMes = Carbon::today()->startOfMonth();
        $inicioMesAnt = Carbon::today()->startOfMonth()->subMonth();
        $finMesAnt = Carbon::today()->startOfMonth()->subSecond();

        $hoyAgg = DB::table('ventas')
            ->where('empresa_id', $empresaId)
            ->where('estado', 'activa')
            ->whereDate('fecha', $hoy)
            ->selectRaw('COUNT(*) AS num, COALESCE(SUM(total),0) AS total, COALESCE(SUM(utilidad),0) AS utilidad')
            ->first();

        $mesAgg = DB::table('ventas')
            ->where('empresa_id', $empresaId)
            ->where('estado', 'activa')
            ->whereBetween('fecha', [$inicioMes, Carbon::now()])
            ->selectRaw('COUNT(*) AS num, COALESCE(SUM(total),0) AS total, COALESCE(SUM(utilidad),0) AS utilidad')
            ->first();

        $mesAntAgg = DB::table('ventas')
            ->where('empresa_id', $empresaId)
            ->where('estado', 'activa')
            ->whereBetween('fecha', [$inicioMesAnt, $finMesAnt])
            ->selectRaw('COUNT(*) AS num, COALESCE(SUM(total),0) AS total, COALESCE(SUM(utilidad),0) AS utilidad')
            ->first();

        $cartera = DB::table('v_cartera_clientes')
            ->where('empresa_id', $empresaId)
            ->orderByDesc('saldo_total')
            ->limit(10)
            ->get();

        $carteraTotal = DB::table('v_cartera_clientes')
            ->where('empresa_id', $empresaId)
            ->sum('saldo_total');

        $cuentasPagar = DB::table('v_cuentas_por_pagar')
            ->where('empresa_id', $empresaId)
            ->orderByDesc('saldo_total')
            ->limit(10)
            ->get();

        $cuentasPagarTotal = DB::table('v_cuentas_por_pagar')
            ->where('empresa_id', $empresaId)
            ->sum('saldo_total');

        $topProductos = DB::table('v_top_productos_mes')
            ->where('empresa_id', $empresaId)
            ->where('anio', $hoy->year)
            ->where('mes', $hoy->month)
            ->orderByDesc('cantidad_vendida')
            ->limit(10)
            ->get();

        return response()->json([
            'ok' => true,
            'empresa' => [
                'id' => $empresaId,
                'nombre' => $empresa->nombre_empresa,
                'nit' => $empresa->nit_empresa,
            ],
            'empresas_elegibles' => $elegibles,
            'fecha_corte' => Carbon::now()->toIso8601String(),
            'hoy' => [
                'num_ventas' => (int) $hoyAgg->num,
                'total' => (float) $hoyAgg->total,
                'utilidad' => (float) $hoyAgg->utilidad,
            ],
            'mes' => [
                'num_ventas' => (int) $mesAgg->num,
                'total' => (float) $mesAgg->total,
                'utilidad' => (float) $mesAgg->utilidad,
            ],
            'mes_anterior' => [
                'num_ventas' => (int) $mesAntAgg->num,
                'total' => (float) $mesAntAgg->total,
                'utilidad' => (float) $mesAntAgg->utilidad,
            ],
            'cartera' => [
                'total' => (float) $carteraTotal,
                'top' => $cartera,
            ],
            'cuentas_por_pagar' => [
                'total' => (float) $cuentasPagarTotal,
                'top' => $cuentasPagar,
            ],
            'top_productos_mes' => $topProductos,
        ]);
    }

    /** Lista completa de ventas del período. */
    public function ventas(Request $request): JsonResponse
    {
        [$empresa, $_] = $this->autenticar($request);
        if (!$empresa) return response()->json(['ok' => false, 'error' => 'auth'], 401);

        $periodo = $request->query('periodo', 'mes'); // hoy|semana|mes|anterior
        [$desde, $hasta] = $this->rangoPeriodo($periodo);

        $ventas = DB::table('ventas as v')
            ->leftJoin('clientes as c', 'c.id', '=', 'v.cliente_id')
            ->where('v.empresa_id', $empresa->id_empresa)
            ->where('v.estado', 'activa')
            ->whereBetween('v.fecha', [$desde, $hasta])
            ->orderByDesc('v.fecha')
            ->limit(200)
            ->get([
                'v.id', 'v.numero_factura', 'v.fecha', 'v.total',
                'v.utilidad', 'v.saldo', 'v.forma_pago_id',
                'c.razon_social as cliente',
            ]);

        return response()->json([
            'ok' => true,
            'empresa' => ['id' => $empresa->id_empresa, 'nombre' => $empresa->nombre_empresa],
            'periodo' => $periodo,
            'desde' => $desde->toIso8601String(),
            'hasta' => $hasta->toIso8601String(),
            'total' => $ventas->sum('total'),
            'utilidad' => $ventas->sum('utilidad'),
            'cantidad' => $ventas->count(),
            'ventas' => $ventas,
        ]);
    }

    /** Lista completa de cartera (todos los clientes con saldo > 0). */
    public function cartera(Request $request): JsonResponse
    {
        [$empresa, $_] = $this->autenticar($request);
        if (!$empresa) return response()->json(['ok' => false, 'error' => 'auth'], 401);

        $cartera = DB::table('v_cartera_clientes')
            ->where('empresa_id', $empresa->id_empresa)
            ->orderByDesc('saldo_total')
            ->get();

        return response()->json([
            'ok' => true,
            'empresa' => ['id' => $empresa->id_empresa, 'nombre' => $empresa->nombre_empresa],
            'total' => $cartera->sum('saldo_total'),
            'cantidad' => $cartera->count(),
            'cartera' => $cartera,
        ]);
    }

    /** Lista completa de cuentas por pagar. */
    public function cuentasPorPagar(Request $request): JsonResponse
    {
        [$empresa, $_] = $this->autenticar($request);
        if (!$empresa) return response()->json(['ok' => false, 'error' => 'auth'], 401);

        $cuentas = DB::table('v_cuentas_por_pagar')
            ->where('empresa_id', $empresa->id_empresa)
            ->orderByDesc('saldo_total')
            ->get();

        return response()->json([
            'ok' => true,
            'empresa' => ['id' => $empresa->id_empresa, 'nombre' => $empresa->nombre_empresa],
            'total' => $cuentas->sum('saldo_total'),
            'cantidad' => $cuentas->count(),
            'cuentas' => $cuentas,
        ]);
    }

    /** Ranking de productos del período. */
    public function productos(Request $request): JsonResponse
    {
        [$empresa, $_] = $this->autenticar($request);
        if (!$empresa) return response()->json(['ok' => false, 'error' => 'auth'], 401);

        $periodo = $request->query('periodo', 'mes');
        [$desde, $hasta] = $this->rangoPeriodo($periodo);

        $productos = DB::table('venta_items as vi')
            ->join('ventas as v', 'v.id', '=', 'vi.venta_id')
            ->leftJoin('productos as p', 'p.id', '=', 'vi.producto_id')
            ->where('v.empresa_id', $empresa->id_empresa)
            ->where('v.estado', 'activa')
            ->whereBetween('v.fecha', [$desde, $hasta])
            ->groupBy('vi.producto_id', 'p.nombre', 'p.codigo')
            ->selectRaw('
                vi.producto_id,
                COALESCE(p.nombre, "Sin producto") as nombre,
                p.codigo,
                SUM(vi.cantidad) as cantidad_vendida,
                SUM(vi.total) as total_vendido,
                SUM(vi.utilidad) as utilidad
            ')
            ->orderByDesc('cantidad_vendida')
            ->limit(100)
            ->get();

        return response()->json([
            'ok' => true,
            'empresa' => ['id' => $empresa->id_empresa, 'nombre' => $empresa->nombre_empresa],
            'periodo' => $periodo,
            'cantidad' => $productos->count(),
            'productos' => $productos,
        ]);
    }

    /**
     * Datos para los gráficos del dashboard. Devuelve 4 series:
     *   1. comparativo_mensual — ventas, utilidad y costo por mes (últimos 6)
     *   2. evolucion_cartera — saldo total pendiente por mes (acumulado)
     *   3. formas_pago — distribución de ventas del mes por forma de pago
     *   4. ventas_por_dia_semana — ritmo del negocio (lun-dom del último mes)
     */
    public function graficos(Request $request): JsonResponse
    {
        [$empresa, $_] = $this->autenticar($request);
        if (!$empresa) return response()->json(['ok' => false, 'error' => 'auth'], 401);
        $empresaId = $empresa->id_empresa;

        // 1. Comparativo mensual — últimos 6 meses
        $comparativo = [];
        for ($i = 5; $i >= 0; $i--) {
            $inicio = Carbon::today()->startOfMonth()->subMonths($i);
            $fin = $inicio->copy()->endOfMonth();
            $r = DB::table('ventas')
                ->where('empresa_id', $empresaId)
                ->where('estado', 'activa')
                ->whereBetween('fecha', [$inicio, $fin])
                ->selectRaw('
                    COUNT(*) AS num,
                    COALESCE(SUM(total),0) AS ventas,
                    COALESCE(SUM(utilidad),0) AS utilidad,
                    COALESCE(SUM(costo_total),0) AS costos
                ')
                ->first();
            $comparativo[] = [
                'mes'      => $inicio->format('Y-m'),
                'etiqueta' => $this->mesCortoEs($inicio),
                'ventas'   => (float) $r->ventas,
                'utilidad' => (float) $r->utilidad,
                'costos'   => (float) $r->costos,
                'num'      => (int) $r->num,
            ];
        }

        // 2. Evolución de cartera — saldo pendiente de ventas por mes de emisión
        $evolucionCartera = DB::table('ventas')
            ->where('empresa_id', $empresaId)
            ->where('estado', 'activa')
            ->where('saldo', '>', 0)
            ->selectRaw('
                DATE_FORMAT(fecha, "%Y-%m") AS mes,
                SUM(saldo) AS saldo_total,
                COUNT(*) AS num
            ')
            ->groupByRaw('DATE_FORMAT(fecha, "%Y-%m")')
            ->orderBy('mes')
            ->get();

        // 3. Formas de pago — distribución del mes actual
        $formasPago = DB::table('ventas as v')
            ->leftJoin('formas_pago as fp', 'fp.id', '=', 'v.forma_pago_id')
            ->where('v.empresa_id', $empresaId)
            ->where('v.estado', 'activa')
            ->whereBetween('v.fecha', [Carbon::today()->startOfMonth(), Carbon::now()])
            ->groupBy('v.forma_pago_id', 'fp.nombre')
            ->selectRaw('
                COALESCE(fp.nombre, "Otro") AS forma,
                COUNT(*) AS num,
                SUM(v.total) AS total
            ')
            ->orderByDesc('total')
            ->get();

        // 4. Ventas por día de la semana — últimos 30 días
        $diasSemana = DB::table('ventas')
            ->where('empresa_id', $empresaId)
            ->where('estado', 'activa')
            ->whereBetween('fecha', [Carbon::now()->subDays(30), Carbon::now()])
            ->selectRaw('
                DAYOFWEEK(fecha) AS dia,
                COUNT(*) AS num,
                SUM(total) AS total
            ')
            ->groupByRaw('DAYOFWEEK(fecha)')
            ->orderBy('dia')
            ->get();

        // Normalizar: siempre 7 días (dom=1 → sáb=7 en MySQL)
        $nombresDia = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        $semana = [];
        for ($i = 1; $i <= 7; $i++) {
            $r = $diasSemana->firstWhere('dia', $i);
            $semana[] = [
                'dia'       => $i,
                'nombre'    => $nombresDia[$i - 1],
                'num'       => $r ? (int) $r->num : 0,
                'total'     => $r ? (float) $r->total : 0,
            ];
        }
        // Reordenar lun→dom (más natural para el usuario)
        $semana = array_merge(array_slice($semana, 1), array_slice($semana, 0, 1));

        return response()->json([
            'ok' => true,
            'empresa' => ['id' => $empresaId, 'nombre' => $empresa->nombre_empresa],
            'comparativo_mensual' => $comparativo,
            'evolucion_cartera' => $evolucionCartera,
            'formas_pago' => $formasPago,
            'ventas_por_dia_semana' => $semana,
        ]);
    }

    private function mesCortoEs(Carbon $d): string
    {
        $meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return $meses[$d->month - 1] . ' ' . substr($d->year, 2);
    }

    /**
     * Lista de gastos del período + totales por categoría.
     * Filtros: ?periodo=hoy|semana|mes|anterior|anio, ?categoria=X
     */
    public function gastos(Request $request): JsonResponse
    {
        [$empresa, $_] = $this->autenticar($request);
        if (!$empresa) return response()->json(['ok' => false, 'error' => 'auth'], 401);

        $periodo = $request->query('periodo', 'mes');
        [$desde, $hasta] = $this->rangoPeriodo($periodo);
        $categoria = $request->query('categoria');

        $q = DB::table('gastos as g')
            ->leftJoin('formas_pago as fp', 'fp.id', '=', 'g.forma_pago_id')
            ->where('g.empresa_id', $empresa->id_empresa)
            ->where('g.estado', 'activo')
            ->whereBetween('g.fecha', [$desde, $hasta]);
        if ($categoria) $q->where('g.categoria', $categoria);

        $gastos = $q->orderByDesc('g.fecha')
            ->limit(200)
            ->get([
                'g.id', 'g.categoria', 'g.concepto', 'g.fecha',
                'g.valor', 'g.beneficiario', 'g.observaciones',
                'fp.nombre as forma_pago',
            ]);

        // Agregado por categoría (sin aplicar el filtro de categoría)
        $porCategoria = DB::table('gastos')
            ->where('empresa_id', $empresa->id_empresa)
            ->where('estado', 'activo')
            ->whereBetween('fecha', [$desde, $hasta])
            ->groupBy('categoria')
            ->selectRaw('categoria, COUNT(*) AS num, SUM(valor) AS total')
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'ok' => true,
            'empresa' => ['id' => $empresa->id_empresa, 'nombre' => $empresa->nombre_empresa],
            'periodo' => $periodo,
            'desde' => $desde->toIso8601String(),
            'hasta' => $hasta->toIso8601String(),
            'total' => $gastos->sum('valor'),
            'cantidad' => $gastos->count(),
            'por_categoria' => $porCategoria,
            'gastos' => $gastos,
        ]);
    }

    /**
     * Estado de Resultados (P&L simplificado) del período.
     * Ingresos − Costo ventas = Utilidad Bruta
     * Utilidad Bruta − Gastos = Utilidad Neta
     * Compara con el período anterior inmediato.
     */
    public function estadoResultados(Request $request): JsonResponse
    {
        [$empresa, $_] = $this->autenticar($request);
        if (!$empresa) return response()->json(['ok' => false, 'error' => 'auth'], 401);
        $empresaId = $empresa->id_empresa;

        $periodo = $request->query('periodo', 'mes');
        [$desde, $hasta] = $this->rangoPeriodo($periodo);
        [$desdeAnt, $hastaAnt] = $this->rangoPeriodoAnterior($periodo, $desde, $hasta);

        $calcular = function ($d, $h) use ($empresaId) {
            $ventas = DB::table('ventas')
                ->where('empresa_id', $empresaId)
                ->where('estado', 'activa')
                ->whereBetween('fecha', [$d, $h])
                ->selectRaw('
                    COALESCE(SUM(total), 0) AS ingresos,
                    COALESCE(SUM(costo_total), 0) AS costo_ventas,
                    COALESCE(SUM(utilidad), 0) AS utilidad_bruta,
                    COUNT(*) AS num_ventas
                ')->first();

            $gastosTot = DB::table('gastos')
                ->where('empresa_id', $empresaId)
                ->where('estado', 'activo')
                ->whereBetween('fecha', [$d, $h])
                ->selectRaw('COALESCE(SUM(valor), 0) AS total, COUNT(*) AS num')
                ->first();

            $gastosDet = DB::table('gastos')
                ->where('empresa_id', $empresaId)
                ->where('estado', 'activo')
                ->whereBetween('fecha', [$d, $h])
                ->groupBy('categoria')
                ->selectRaw('categoria, SUM(valor) AS total')
                ->orderByDesc('total')
                ->get();

            $ingresos = (float) $ventas->ingresos;
            $costoVentas = (float) $ventas->costo_ventas;
            $utilBruta = $ingresos - $costoVentas;
            $gastos = (float) $gastosTot->total;
            $utilNeta = $utilBruta - $gastos;

            return [
                'ingresos'        => $ingresos,
                'costo_ventas'    => $costoVentas,
                'utilidad_bruta'  => $utilBruta,
                'margen_bruto'    => $ingresos > 0 ? ($utilBruta / $ingresos * 100) : 0,
                'gastos'          => $gastos,
                'utilidad_neta'   => $utilNeta,
                'margen_neto'     => $ingresos > 0 ? ($utilNeta / $ingresos * 100) : 0,
                'num_ventas'      => (int) $ventas->num_ventas,
                'num_gastos'      => (int) $gastosTot->num,
                'gastos_por_cat'  => $gastosDet,
            ];
        };

        $actual = $calcular($desde, $hasta);
        $anterior = $calcular($desdeAnt, $hastaAnt);

        return response()->json([
            'ok' => true,
            'empresa' => ['id' => $empresaId, 'nombre' => $empresa->nombre_empresa],
            'periodo' => $periodo,
            'desde' => $desde->toIso8601String(),
            'hasta' => $hasta->toIso8601String(),
            'actual' => $actual,
            'anterior' => $anterior,
        ]);
    }

    /**
     * Lista completa de clientes con totales (facturado histórico, saldo pendiente).
     * Filtros: ?search=texto, ?orden=nombre|monto|deuda, ?solo_con_deuda=1
     */
    public function clientesListado(Request $request): JsonResponse
    {
        [$empresa, $_] = $this->autenticar($request);
        if (!$empresa) return response()->json(['ok' => false, 'error' => 'auth'], 401);

        $search = trim((string) $request->query('search', ''));
        $orden = $request->query('orden', 'monto');
        $soloDeuda = (bool) $request->query('solo_con_deuda', false);

        $q = DB::table('clientes as c')
            ->leftJoin('tipos_documento as td', 'td.id', '=', 'c.tipo_documento_id')
            ->leftJoinSub(
                DB::table('ventas')
                    ->where('empresa_id', $empresa->id_empresa)
                    ->where('estado', 'activa')
                    ->groupBy('cliente_id')
                    ->selectRaw('
                        cliente_id,
                        COUNT(*) as num_facturas,
                        COALESCE(SUM(total), 0) as total_facturado,
                        COALESCE(SUM(saldo), 0) as saldo_pendiente,
                        MAX(fecha) as ultima_compra
                    '),
                'v', 'v.cliente_id', '=', 'c.id'
            )
            ->where('c.empresa_id', $empresa->id_empresa)
            ->whereNull('c.deleted_at');

        if ($search !== '') {
            $q->where(function ($w) use ($search) {
                $w->where('c.razon_social', 'LIKE', "%{$search}%")
                  ->orWhere('c.numero_documento', 'LIKE', "%{$search}%")
                  ->orWhere('c.telefono', 'LIKE', "%{$search}%")
                  ->orWhere('c.codigo_externo', 'LIKE', "%{$search}%");
            });
        }
        if ($soloDeuda) {
            $q->whereRaw('COALESCE(v.saldo_pendiente, 0) > 0');
        }

        switch ($orden) {
            case 'nombre':  $q->orderBy('c.razon_social'); break;
            case 'deuda':   $q->orderByDesc(DB::raw('COALESCE(v.saldo_pendiente, 0)')); break;
            case 'ultima':  $q->orderByDesc('v.ultima_compra'); break;
            default:        $q->orderByDesc(DB::raw('COALESCE(v.total_facturado, 0)'));
        }

        $clientes = $q->limit(200)->get([
            'c.id', 'c.codigo_externo', 'c.razon_social', 'c.numero_documento',
            'c.telefono', 'c.whatsapp', 'c.direccion', 'c.email',
            'td.codigo as tipo_doc',
            'v.num_facturas', 'v.total_facturado', 'v.saldo_pendiente', 'v.ultima_compra',
        ]);

        $totales = DB::table('clientes')
            ->where('empresa_id', $empresa->id_empresa)
            ->whereNull('deleted_at')
            ->selectRaw('
                COUNT(*) AS num_clientes,
                SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS activos
            ')->first();

        return response()->json([
            'ok' => true,
            'empresa' => ['id' => $empresa->id_empresa, 'nombre' => $empresa->nombre_empresa],
            'totales' => [
                'num_clientes' => (int) $totales->num_clientes,
                'activos'      => (int) $totales->activos,
            ],
            'clientes' => $clientes,
            'filtros'  => compact('search', 'orden', 'soloDeuda'),
        ]);
    }

    /**
     * Lista completa de proveedores con totales de compras y saldo.
     */
    public function proveedoresListado(Request $request): JsonResponse
    {
        [$empresa, $_] = $this->autenticar($request);
        if (!$empresa) return response()->json(['ok' => false, 'error' => 'auth'], 401);

        $search = trim((string) $request->query('search', ''));
        $orden = $request->query('orden', 'monto');
        $soloDeuda = (bool) $request->query('solo_con_deuda', false);

        $q = DB::table('proveedores as p')
            ->leftJoinSub(
                DB::table('compras')
                    ->where('empresa_id', $empresa->id_empresa)
                    ->where('estado', 'activa')
                    ->groupBy('proveedor_id')
                    ->selectRaw('
                        proveedor_id,
                        COUNT(*) as num_facturas,
                        COALESCE(SUM(total), 0) as total_comprado,
                        COALESCE(SUM(saldo), 0) as saldo_debido,
                        MAX(fecha) as ultima_compra
                    '),
                'c', 'c.proveedor_id', '=', 'p.id'
            )
            ->where('p.empresa_id', $empresa->id_empresa)
            ->whereNull('p.deleted_at');

        if ($search !== '') {
            $q->where(function ($w) use ($search) {
                $w->where('p.razon_social', 'LIKE', "%{$search}%")
                  ->orWhere('p.numero_documento', 'LIKE', "%{$search}%")
                  ->orWhere('p.telefono', 'LIKE', "%{$search}%");
            });
        }
        if ($soloDeuda) {
            $q->whereRaw('COALESCE(c.saldo_debido, 0) > 0');
        }

        switch ($orden) {
            case 'nombre':  $q->orderBy('p.razon_social'); break;
            case 'deuda':   $q->orderByDesc(DB::raw('COALESCE(c.saldo_debido, 0)')); break;
            case 'ultima':  $q->orderByDesc('c.ultima_compra'); break;
            default:        $q->orderByDesc(DB::raw('COALESCE(c.total_comprado, 0)'));
        }

        $proveedores = $q->limit(200)->get([
            'p.id', 'p.codigo_externo', 'p.razon_social', 'p.numero_documento',
            'p.telefono', 'p.email', 'p.direccion', 'p.cuenta_bancaria',
            'c.num_facturas', 'c.total_comprado', 'c.saldo_debido', 'c.ultima_compra',
        ]);

        $totales = DB::table('proveedores')
            ->where('empresa_id', $empresa->id_empresa)
            ->whereNull('deleted_at')
            ->selectRaw('COUNT(*) AS num_proveedores, SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS activos')
            ->first();

        return response()->json([
            'ok' => true,
            'empresa' => ['id' => $empresa->id_empresa, 'nombre' => $empresa->nombre_empresa],
            'totales' => [
                'num_proveedores' => (int) $totales->num_proveedores,
                'activos'         => (int) $totales->activos,
            ],
            'proveedores' => $proveedores,
            'filtros' => compact('search', 'orden', 'soloDeuda'),
        ]);
    }

    /**
     * Inventario — lista de productos con existencia, valor y alertas.
     * Filtros opcionales: ?search=texto, ?orden=valor|existencia|nombre, ?solo_bajos=1
     */
    public function inventario(Request $request): JsonResponse
    {
        [$empresa, $_] = $this->autenticar($request);
        if (!$empresa) return response()->json(['ok' => false, 'error' => 'auth'], 401);

        $search = trim((string) $request->query('search', ''));
        $orden = $request->query('orden', 'valor'); // valor|existencia|nombre|rotacion
        $soloBajos = (bool) $request->query('solo_bajos', false);

        $q = DB::table('productos as p')
            ->leftJoin('categorias as c', 'c.id', '=', 'p.categoria_id')
            ->where('p.empresa_id', $empresa->id_empresa)
            ->where('p.activo', true);

        if ($search !== '') {
            $q->where(function ($w) use ($search) {
                $w->where('p.nombre', 'LIKE', "%{$search}%")
                  ->orWhere('p.codigo', 'LIKE', "%{$search}%")
                  ->orWhere('p.codigo_barras', 'LIKE', "%{$search}%");
            });
        }

        if ($soloBajos) {
            $q->whereColumn('p.existencia', '<=', 'p.existencia_minima');
        }

        switch ($orden) {
            case 'nombre':     $q->orderBy('p.nombre'); break;
            case 'existencia': $q->orderByDesc('p.existencia'); break;
            case 'valor':      $q->orderByRaw('p.existencia * p.precio_costo DESC'); break;
            case 'bajo':       $q->orderByRaw('p.existencia - p.existencia_minima'); break;
            default: $q->orderByRaw('p.existencia * p.precio_costo DESC');
        }

        $productos = $q->limit(200)->get([
            'p.id', 'p.codigo', 'p.codigo_barras', 'p.nombre',
            'p.precio_costo', 'p.precio_venta', 'p.existencia', 'p.existencia_minima',
            'p.es_servicio', 'c.nombre as categoria',
            DB::raw('(p.existencia * p.precio_costo) as valor_costo'),
            DB::raw('(p.existencia * p.precio_venta) as valor_venta'),
        ]);

        // Totales del inventario completo (no limitado al LIMIT 200)
        $totales = DB::table('productos')
            ->where('empresa_id', $empresa->id_empresa)
            ->where('activo', true)
            ->where('es_servicio', false)
            ->selectRaw('
                COUNT(*) AS num_productos,
                COALESCE(SUM(existencia * precio_costo), 0) AS valor_costo,
                COALESCE(SUM(existencia * precio_venta), 0) AS valor_venta,
                SUM(CASE WHEN existencia <= existencia_minima THEN 1 ELSE 0 END) AS stock_bajo,
                SUM(CASE WHEN existencia = 0 THEN 1 ELSE 0 END) AS sin_stock
            ')
            ->first();

        return response()->json([
            'ok' => true,
            'empresa' => ['id' => $empresa->id_empresa, 'nombre' => $empresa->nombre_empresa],
            'totales' => [
                'num_productos' => (int) $totales->num_productos,
                'valor_costo'   => (float) $totales->valor_costo,
                'valor_venta'   => (float) $totales->valor_venta,
                'ganancia_potencial' => (float) $totales->valor_venta - (float) $totales->valor_costo,
                'stock_bajo'    => (int) $totales->stock_bajo,
                'sin_stock'     => (int) $totales->sin_stock,
            ],
            'productos' => $productos,
            'filtros' => compact('search', 'orden', 'soloBajos'),
        ]);
    }

    /** Detalle de una venta: cabecera + items + pagos aplicados. */
    public function detalleVenta(Request $request, int $id): JsonResponse
    {
        [$empresa, $_] = $this->autenticar($request);
        if (!$empresa) return response()->json(['ok' => false, 'error' => 'auth'], 401);

        $venta = DB::table('ventas as v')
            ->leftJoin('clientes as c', 'c.id', '=', 'v.cliente_id')
            ->leftJoin('formas_pago as fp', 'fp.id', '=', 'v.forma_pago_id')
            ->where('v.id', $id)
            ->where('v.empresa_id', $empresa->id_empresa)
            ->first([
                'v.*',
                'c.razon_social as cliente_nombre',
                'c.telefono as cliente_telefono',
                'c.whatsapp as cliente_whatsapp',
                'c.id as cliente_id_remoto',
                'fp.nombre as forma_pago',
            ]);
        if (!$venta) return response()->json(['ok' => false, 'error' => 'no_encontrada'], 404);

        $items = DB::table('venta_items as vi')
            ->leftJoin('productos as p', 'p.id', '=', 'vi.producto_id')
            ->where('vi.venta_id', $id)
            ->get([
                'vi.descripcion', 'vi.cantidad', 'vi.precio_venta',
                'vi.precio_costo', 'vi.subtotal', 'vi.impuesto', 'vi.total', 'vi.utilidad',
                'p.nombre as producto_nombre',
            ]);

        $pagos = DB::table('pagos')
            ->where('venta_id', $id)
            ->where('estado', 'activo')
            ->orderByDesc('fecha')
            ->get(['id', 'fecha', 'valor', 'observaciones']);

        return response()->json([
            'ok' => true,
            'empresa' => ['id' => $empresa->id_empresa, 'nombre' => $empresa->nombre_empresa],
            'venta' => $venta,
            'items' => $items,
            'pagos' => $pagos,
        ]);
    }

    /** Facturas pendientes de un cliente — para cobro. */
    public function facturasCliente(Request $request, int $id): JsonResponse
    {
        [$empresa, $_] = $this->autenticar($request);
        if (!$empresa) return response()->json(['ok' => false, 'error' => 'auth'], 401);

        $cliente = DB::table('clientes')
            ->where('id', $id)
            ->where('empresa_id', $empresa->id_empresa)
            ->first(['id', 'razon_social', 'numero_documento', 'telefono', 'whatsapp', 'direccion']);
        if (!$cliente) return response()->json(['ok' => false, 'error' => 'no_encontrado'], 404);

        $facturas = DB::table('ventas')
            ->where('empresa_id', $empresa->id_empresa)
            ->where('cliente_id', $id)
            ->where('estado', 'activa')
            ->where('saldo', '>', 0)
            ->orderBy('fecha')
            ->get(['id', 'numero_factura', 'fecha', 'total', 'abono', 'saldo', 'dias_credito']);

        $facturasPagadas = DB::table('ventas')
            ->where('empresa_id', $empresa->id_empresa)
            ->where('cliente_id', $id)
            ->where('estado', 'activa')
            ->where('saldo', 0)
            ->orderByDesc('fecha')
            ->limit(10)
            ->get(['id', 'numero_factura', 'fecha', 'total']);

        return response()->json([
            'ok' => true,
            'empresa' => ['id' => $empresa->id_empresa, 'nombre' => $empresa->nombre_empresa],
            'cliente' => $cliente,
            'saldo_total' => $facturas->sum('saldo'),
            'facturas_pendientes' => $facturas,
            'ultimas_pagadas' => $facturasPagadas,
        ]);
    }

    private function rangoPeriodo(string $periodo): array
    {
        $hoy = Carbon::today();
        // Nota: usamos endOfDay() (23:59:59) en vez de Carbon::now() para
        // evitar que ventas futuras del mismo día queden fuera por diferencia
        // de reloj entre PHP y el servidor MySQL (típico en Hostinger).
        return match ($periodo) {
            'hoy'      => [$hoy->copy()->startOfDay(), $hoy->copy()->endOfDay()],
            'semana'   => [$hoy->copy()->startOfWeek(), $hoy->copy()->endOfDay()],
            'anterior' => [$hoy->copy()->startOfMonth()->subMonth(), $hoy->copy()->startOfMonth()->subSecond()],
            'anio'     => [$hoy->copy()->startOfYear(), $hoy->copy()->endOfDay()],
            default    => [$hoy->copy()->startOfMonth(), $hoy->copy()->endOfDay()], // mes
        };
    }

    /**
     * Rango equivalente del período anterior inmediato — pensado para comparativos
     * "manzanas con manzanas". Para "hoy" compara con ayer; para "mes" con mes
     * pasado completo; para "semana" con semana pasada completa.
     */
    private function rangoPeriodoAnterior(string $periodo, Carbon $desde, Carbon $hasta): array
    {
        $hoy = Carbon::today();
        return match ($periodo) {
            'hoy'      => [$hoy->copy()->subDay(), $hoy->copy()->subDay()->endOfDay()],
            'semana'   => [$hoy->copy()->startOfWeek()->subWeek(), $hoy->copy()->startOfWeek()->subSecond()],
            'anterior' => [$hoy->copy()->startOfMonth()->subMonths(2), $hoy->copy()->startOfMonth()->subMonth()->subSecond()],
            'anio'     => [$hoy->copy()->startOfYear()->subYear(), $hoy->copy()->startOfYear()->subSecond()],
            default    => [$hoy->copy()->startOfMonth()->subMonth(), $hoy->copy()->startOfMonth()->subSecond()],
        };
    }
}
