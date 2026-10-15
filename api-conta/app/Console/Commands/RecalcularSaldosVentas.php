<?php

namespace App\Console\Commands;

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
                            {--dry-run : No guarda cambios, solo imprime lo que haría}';

    protected $description = 'Recalcula ventas.saldo descontando los pagos aplicados';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $empresaFiltro = $this->option('empresa');

        $query = Venta::query();
        if ($empresaFiltro) {
            $query->where('empresa_id', (int) $empresaFiltro);
            $this->info("Filtrando empresa_id={$empresaFiltro}");
        }

        $total = (clone $query)->count();
        $this->info("Ventas a revisar: {$total}" . ($dryRun ? ' (DRY RUN — no se guarda nada)' : ''));

        $actualizadas = 0;
        $sinCambio = 0;
        $totalAjustado = 0.0;

        $query->orderBy('id')->chunk(500, function ($ventas) use (&$actualizadas, &$sinCambio, &$totalAjustado, $dryRun) {
            foreach ($ventas as $venta) {
                $aplicado = Pago::where('venta_id', $venta->id)
                    ->where('estado', 'activo')
                    ->selectRaw('COALESCE(SUM(valor), 0) - COALESCE(SUM(descuento), 0) - COALESCE(SUM(retencion), 0) AS t')
                    ->value('t');

                $nuevoSaldo = max(0, (float) $venta->total - (float) $aplicado);
                $saldoActual = (float) $venta->saldo;

                if (abs($nuevoSaldo - $saldoActual) < 0.01) {
                    $sinCambio++;
                    continue;
                }

                $delta = $saldoActual - $nuevoSaldo;
                $totalAjustado += $delta;
                $actualizadas++;

                $this->line(sprintf(
                    "  venta #%d (cliente %s, factura %s): saldo %s → %s  (δ %s)",
                    $venta->id,
                    $venta->cliente_id,
                    $venta->codigo_externo ?: $venta->numero_factura,
                    number_format($saldoActual, 0, '.', ','),
                    number_format($nuevoSaldo, 0, '.', ','),
                    number_format($delta, 0, '.', ',')
                ));

                if (!$dryRun) {
                    $venta->saldo = $nuevoSaldo;
                    $venta->abono = (float) $venta->total - $nuevoSaldo;
                    $venta->save();
                }
            }
        });

        $this->newLine();
        $this->info("Resumen:");
        $this->info("  · Ventas sin cambio: {$sinCambio}");
        $this->info("  · Ventas con ajuste: {$actualizadas}");
        $this->info("  · Monto neto ajustado (saldo descontado): $" . number_format($totalAjustado, 0, '.', ','));
        if ($dryRun) {
            $this->warn('DRY RUN — ningún cambio fue guardado. Re-ejecuta sin --dry-run para aplicar.');
        }

        return self::SUCCESS;
    }
}
