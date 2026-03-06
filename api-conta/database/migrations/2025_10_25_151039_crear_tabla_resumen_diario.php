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
        Schema::create('resumen_diario', function (Blueprint $table) {
            $table->id('id_resumen');
            $table->unsignedBigInteger('id_empresa');
            $table->date('fecha');
            $table->decimal('total_ventas', 10, 2)->default(0);
            $table->decimal('total_compras', 10, 2)->default(0);
            $table->decimal('total_gastos', 10, 2)->default(0);
            $table->decimal('utilidad_bruta', 10, 2)->default(0);
            $table->integer('numero_facturas')->default(0);
            $table->timestamps();

            $table->foreign('id_empresa')
                  ->references('id_empresa')
                  ->on('empresas')
                  ->onDelete('cascade');

            $table->unique(['id_empresa', 'fecha']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resumen_diario');
    }
};
