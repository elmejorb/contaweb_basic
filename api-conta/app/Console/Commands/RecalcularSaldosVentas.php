<?php

namespace App\Console\Commands;

use App\Models\V2\Cliente;
use App\Models\V2\Pago;
use App\Models\V2\Venta;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Recalcula ventas.saldo = total − SUM(pagos activos − descuentos − retenciones)
 * para toda la cartera histórica.
 *
 * Necesario porque hasta ahora el upsertPago no actualizaba el saldo de la venta,
 * así que la cartera remota quedó mostrando saldos pre-pago en ventas que ya se
 * habían cobrado parcial o totalmente.
 *
 * Uso:
 *   php artisan saldos:recalcular                       # todas las empresas
 *   php artisan saldos:recalcular --empresa=6           # solo una empresa
 *   php artisan saldos:recalcular --dry-run             # solo mostrar cambios, no guardarlos
 */
class RecalcularSaldosVentas extends Command
{
    protected $signature = 'saldos:recalcular
                            {--empresa= : Limitar a una empresa específica (id_empresa)}
                            {--dry-run : No guarda cambios, solo imprime lo que haría}
                            {--solo-reducir : Solo aplicar cuando el saldo nuevo es MENOR al actual (bug clásico del pago no bajado). Ignora δ negativas.}';

    protected $description = 'Recalcula ventas.saldo descontando los pagos aplicados';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $soloReducir = (bool) $this->option('solo-reducir');
        $empresaFiltro = $this->option('empresa');

        $query = Venta::query();
        if ($empresaFiltro) {
            $query->where('empresa_id', (int) $empresaFiltro);
            $this->info("Filtrando empresa_id={$empresaFiltro}");
        }

        $total = (clone $query)->count();
        $this->info("Ventas a revisar: {$total}" . ($dryRun ? ' (DRY RUN — no se guarda nada)' : ''));
        if ($soloReducir) {
            $this->info('Modo: --solo-reducir (solo baja saldos por pagos; ignora δ negativas)');
        }

        $actualizadas = 0;
        $sinCambio = 0;
        $totalBajadas = 0.0;
        $totalSubidas = 0.0;
        $omitidasPorModo = 0;
        $deltasPositivas = [];
        $deltasNegativas = [];

        $query->orderBy('id')->chunk(500, function ($ventas) use (
            &$actualizadas, &$sinCambio, &$totalBajadas, &$totalSubidas,
            &$omitidasPorModo, &$deltasPositivas, &$deltasNegativas,
            $dryRun, $soloReducir
        ) {
            foreach ($ventas as $venta) {
                // Regla clave: una venta al CONTADO (forma_pago_id != 6) siempre
                // tiene saldo 0, porque en VB6 el pago se registra en la caja al
                // momento sin generar fila en tblpagos. Solo las ventas a CRÉDITO
                // (forma_pago_id = 6) acumulan saldo que se baja con pagos.
                $esCredito = (int) $venta->forma_pago_id === 6;

                if ($esCredito) {
                    $aplicado = Pago::where('venta_id', $venta->id)
                        ->where('estado', 'activo')
                        ->selectRaw('COALESCE(SUM(valor), 0) - COALESCE(SUM(descuento), 0) - COALESCE(SUM(retencion), 0) AS t')
                        ->value('t');
                    $nuevoSaldo = max(0, (float) $venta->total - (float) $aplicado);
                } else {
                    // Contado / transferencia / nequi / etc. → siempre $0
                    $nuevoSaldo = 0.0;
                }

                $saldoActual = (float) $venta->saldo;

                if (abs($nuevoSaldo - $saldoActual) < 0.01) {
                    $sinCambio++;
                    continue;
                }

                // Cliente para hacer el log más legible
                $cliente = Cliente::find($venta->cliente_id);
                $clienteStr = $cliente
                    ? substr($cliente->razon_social ?? '?', 0, 30) . ' (vb6=' . ($cliente->codigo_externo ?? '?') . ')'
                    : 'cliente_id=' . $venta->cliente_id;

                $delta = $saldoActual - $nuevoSaldo;
                $facturaVb6 = $venta->codigo_externo ?: $venta->numero_factura;

                $linea = sprintf(
                    "  venta #%d · fact vb6 %s · %-45s · saldo %10s → %10s  (δ %s)",
                    $venta->id,
                    $facturaVb6,
                    $clienteStr,
                    number_format($saldoActual, 0, '.', ','),
                    number_format($nuevoSaldo, 0, '.', ','),
                    number_format($delta, 0, '.', ',')
                );

                if ($delta > 0) $deltasPositivas[] = $linea;
                else $deltasNegativas[] = $linea;

                // --solo-reducir: ignorar δ negativas (saldos que SUBEN)
                if ($soloReducir && $delta < 0) {
                    $omitidasPorModo++;
                    continue;
                }

                if ($delta > 0) $totalBajadas += $delta;
                else $totalSubidas += abs($delta);
                $actualizadas++;

                if (!$dryRun) {
                    $venta->saldo = $nuevoSaldo;
                    $venta->abono = (float) $venta->total - $nuevoSaldo;
                    $venta->save();
                }
            }
        });

        $this->newLine();
        if ($deltasPositivas) {
            $this->info('📉 δ positivas (saldo BAJA: pago llegó y no se descontaba) — ' . count($deltasPositivas) . ' ventas:');
            foreach ($deltasPositivas as $l) $this->line($l);
            $this->newLine();
        }
        if ($deltasNegativas) {
            $this->warn('📈 δ negativas (saldo SUBE: remoto tenía $0 o menos del real) — ' . count($deltasNegativas) . ' ventas:');
            foreach ($deltasNegativas as $l) $this->line($l);
            $this->newLine();
        }

        $this->info("Resumen:");
        $this->info("  · Ventas sin cambio:        {$sinCambio}");
        $this->info("  · Ventas que se bajarían:   " . count($deltasPositivas) . "  → suma: $" . number_format($totalBajadas, 0, '.', ','));
        $this->info("  · Ventas que subirían:      " . count($deltasNegativas) . "  → suma: $" . number_format(array_sum(array_map(function($l){ return 0; }, $deltasNegativas)), 0, '.', ','));
        if ($soloReducir) {
            $this->warn("  · Omitidas por --solo-reducir: {$omitidasPorModo}");
        }
        $this->info("  · Ventas afectadas:         {$actualizadas}");
        if ($dryRun) {
            $this->warn('DRY RUN — ningún cambio fue guardado. Re-ejecuta sin --dry-run para aplicar.');
        }

        return self::SUCCESS;
    }
}
