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
        if (Schema::hasTable('movimientos_caja')) {
            return;
        }

        Schema::create('movimientos_caja', function (Blueprint $table) {
            $table->id('id_movimiento');
            $table->unsignedBigInteger('id_empresa');
            $table->unsignedBigInteger('id_usuario');
            $table->unsignedBigInteger('id_cierre')->nullable()->comment('Cierre al que pertenece');
            $table->string('codvb6', 50)->nullable();

            $table->date('fecha');
            $table->time('hora')->nullable();

            $table->enum('tipo', ['entrada', 'salida'])->comment('Tipo de movimiento');
            $table->string('concepto', 255)->comment('Descripción del movimiento');
            $table->string('categoria', 100)->nullable()->comment('Categoría: venta, pago_cliente, gasto, etc.');

            $table->decimal('monto', 14, 4);
            $table->decimal('saldo_anterior', 14, 4)->default(0);
            $table->decimal('saldo_nuevo', 14, 4)->default(0);

            $table->string('referencia', 100)->nullable()->comment('Número de factura, recibo, etc.');
            $table->text('observaciones')->nullable();

            $table->boolean('anulado')->default(false);
            $table->unsignedBigInteger('anulado_por')->nullable();
            $table->dateTime('fecha_anulacion')->nullable();

            $table->timestamps();

            // Índices
            $table->index(['id_empresa', 'fecha']);
            $table->index(['id_empresa', 'id_usuario', 'fecha']);
            $table->index(['id_empresa', 'id_cierre']);

            // Foreign keys
            $table->foreign('id_empresa')
                  ->references('id_empresa')
                  ->on('empresas')
                  ->onDelete('cascade');

            $table->foreign('id_usuario')
                  ->references('id_usuario')
                  ->on('usuarios')
                  ->onDelete('restrict');

            $table->foreign('id_cierre')
                  ->references('id_cierre')
                  ->on('cierres_caja')
                  ->onDelete('set null');

            $table->foreign('anulado_por')
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
        Schema::dropIfExists('movimientos_caja');
    }
};
