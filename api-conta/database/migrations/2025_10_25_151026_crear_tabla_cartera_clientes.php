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
        Schema::create('cartera_clientes', function (Blueprint $table) {
            $table->id('id_cartera');
            $table->unsignedBigInteger('id_cliente');
            $table->unsignedBigInteger('id_venta')->nullable();
            $table->string('tipo_movimiento', 20); // abono, cargo, saldo_inicial
            $table->decimal('valor', 10, 2);
            $table->date('fecha_movimiento');
            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->foreign('id_cliente')
                  ->references('id_cliente')
                  ->on('clientes')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cartera_clientes');
    }
};
