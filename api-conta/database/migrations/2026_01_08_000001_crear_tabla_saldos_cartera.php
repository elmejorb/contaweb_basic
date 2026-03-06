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
        Schema::create('saldos_cartera', function (Blueprint $table) {
            $table->id('id_saldo_cartera');
            $table->unsignedBigInteger('id_empresa');
            $table->string('codigo_tercero', 50); // Código del cliente o proveedor
            $table->string('nombre_tercero', 255); // Nombre del cliente o proveedor
            $table->enum('tipo', ['cliente', 'proveedor']); // Tipo de tercero
            $table->decimal('saldo_total', 15, 2)->default(0); // Saldo total
            $table->timestamps();

            // Índices
            $table->foreign('id_empresa')
                  ->references('id_empresa')
                  ->on('empresas')
                  ->onDelete('cascade');

            // Índice único para evitar duplicados por empresa + código + tipo
            $table->unique(['id_empresa', 'codigo_tercero', 'tipo'], 'uk_empresa_codigo_tipo');

            // Índice para búsquedas rápidas
            $table->index(['id_empresa', 'tipo', 'saldo_total']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('saldos_cartera');
    }
};
