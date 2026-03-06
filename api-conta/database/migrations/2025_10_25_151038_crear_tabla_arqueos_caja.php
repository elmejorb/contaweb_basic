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
        Schema::create('arqueos_caja', function (Blueprint $table) {
            $table->id('id_arqueo');
            $table->unsignedBigInteger('id_empresa');
            $table->unsignedBigInteger('id_usuario');
            $table->date('fecha_arqueo');
            $table->decimal('saldo_inicial', 10, 2);
            $table->decimal('total_ingresos', 10, 2)->default(0);
            $table->decimal('total_egresos', 10, 2)->default(0);
            $table->decimal('saldo_final', 10, 2);
            $table->decimal('saldo_real', 10, 2)->nullable();
            $table->decimal('diferencia', 10, 2)->nullable();
            $table->text('observaciones')->nullable();
            $table->boolean('cerrado')->default(0);
            $table->timestamps();

            $table->foreign('id_empresa')
                  ->references('id_empresa')
                  ->on('empresas')
                  ->onDelete('cascade');
            $table->foreign('id_usuario')
                  ->references('id_usuario')
                  ->on('usuarios')
                  ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('arqueos_caja');
    }
};
