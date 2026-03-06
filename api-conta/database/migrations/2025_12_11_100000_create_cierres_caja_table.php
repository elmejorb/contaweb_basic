<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('cierres_caja')) {
            return;
        }

        Schema::create('cierres_caja', function (Blueprint $table) {
            $table->id('id_cierre');
            $table->unsignedBigInteger('id_empresa');
            $table->unsignedBigInteger('id_usuario')->nullable()->comment('Usuario/vendedor que hace el cierre, NULL = todos');
            $table->string('codvb6', 50)->nullable()->comment('Cod_ControlCaja de VB6');

            // Fechas y tiempos
            $table->date('fecha');
            $table->dateTime('fecha_cierre')->nullable()->comment('Fecha/hora real del cierre');

            // Base de caja
            $table->decimal('base_inicial', 14, 4)->default(0)->comment('ValorInicialCaja');
            $table->decimal('base_siguiente', 14, 4)->default(0)->comment('Base para el siguiente día');

            // Arqueo físico (desglose)
            $table->decimal('arqueo_billetes', 14, 4)->default(0)->comment('Villetes');
            $table->decimal('arqueo_monedas', 14, 4)->default(0)->comment('Monedas');
            $table->decimal('arqueo_cheques', 14, 4)->default(0)->comment('Cheques');
            $table->decimal('arqueo_total', 14, 4)->default(0)->comment('ValorTotal - Total arqueo físico');

            // Valores del sistema
            $table->decimal('saldo_libros', 14, 4)->default(0)->comment('SaldoEnLibros - Lo que debería haber');
            $table->decimal('diferencia', 14, 4)->default(0)->comment('Diferencia arqueo vs libros');

            // Ventas
            $table->decimal('ventas_contado', 14, 4)->default(0)->comment('VContado');
            $table->decimal('ventas_credito', 14, 4)->default(0)->comment('VCredito');
            $table->decimal('ventas_tarjeta', 14, 4)->default(0)->comment('Ventas con tarjeta');
            $table->decimal('ventas_transferencia', 14, 4)->default(0)->comment('Bancos/Transferencias');
            $table->decimal('ventas_nequi', 14, 4)->default(0)->comment('Nequi/Daviplata');

            // Otros ingresos
            $table->decimal('pagos_clientes', 14, 4)->default(0)->comment('Pagos - Abonos de clientes');
            $table->decimal('otros_ingresos', 14, 4)->default(0)->comment('Otros ingresos');

            // Egresos
            $table->decimal('egresos', 14, 4)->default(0)->comment('Egresos/Gastos');
            $table->decimal('devoluciones_ventas', 14, 4)->default(0)->comment('Devoluciones de ventas');
            $table->decimal('devoluciones_compras', 14, 4)->default(0)->comment('Devoluciones de compras');
            $table->decimal('pagos_proveedores', 14, 4)->default(0)->comment('Pagos a proveedores');

            // Separados (apartados)
            $table->decimal('separados', 14, 4)->default(0)->comment('Ventas separadas/apartados');

            // Totales
            $table->decimal('total_efectivo', 14, 4)->default(0)->comment('Total en efectivo');
            $table->decimal('total_venta_dia', 14, 4)->default(0)->comment('Total venta del día');

            // Inventario
            $table->decimal('valor_inventario', 14, 4)->default(0)->comment('VInventario - Valor inventario al cierre');

            // Estado y aprobación
            $table->tinyInteger('estado')->default(0)->comment('-1=Anulado, 0=Abierto, 1=Cerrado, 2=Aprobado');
            $table->unsignedBigInteger('aprobado_por')->nullable()->comment('Usuario que aprueba');
            $table->dateTime('fecha_aprobacion')->nullable();

            // Observaciones
            $table->text('observaciones')->nullable();

            $table->timestamps();

            // Índices
            $table->index(['id_empresa', 'fecha']);
            $table->index(['id_empresa', 'id_usuario', 'fecha']);
            $table->index(['id_empresa', 'codvb6']);

            // Foreign keys
            $table->foreign('id_empresa')
                  ->references('id_empresa')
                  ->on('empresas')
                  ->onDelete('cascade');

            $table->foreign('id_usuario')
                  ->references('id_usuario')
                  ->on('usuarios')
                  ->onDelete('set null');

            $table->foreign('aprobado_por')
                  ->references('id_usuario')
                  ->on('usuarios')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cierres_caja');
    }
};
