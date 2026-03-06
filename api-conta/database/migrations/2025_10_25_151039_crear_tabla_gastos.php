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
        Schema::create('gastos', function (Blueprint $table) {
            $table->id('id_gasto');
            $table->unsignedBigInteger('id_empresa');
            $table->unsignedBigInteger('id_categoria_gasto');
            $table->unsignedBigInteger('id_usuario');
            $table->date('fecha_gasto');
            $table->string('concepto', 200);
            $table->decimal('valor', 10, 2);
            $table->string('forma_pago', 20);
            $table->text('observaciones')->nullable();
            $table->string('sincronizado', 1)->default('N');
            $table->timestamps();

            $table->foreign('id_empresa')
                  ->references('id_empresa')
                  ->on('empresas')
                  ->onDelete('cascade');
            $table->foreign('id_categoria_gasto')
                  ->references('id_categoria_gasto')
                  ->on('categorias_gasto')
                  ->onDelete('restrict');
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
        Schema::dropIfExists('gastos');
    }
};
