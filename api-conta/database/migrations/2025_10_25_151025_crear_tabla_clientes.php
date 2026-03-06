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
        Schema::create('clientes', function (Blueprint $table) {
            $table->id('id_cliente');
            $table->unsignedBigInteger('id_empresa');
            $table->string('tipo_documento', 20);
            $table->string('numero_documento', 50);
            $table->string('nombre_cliente', 200);
            $table->string('telefono_cliente', 50)->nullable();
            $table->string('email_cliente', 100)->nullable();
            $table->text('direccion_cliente')->nullable();
            $table->string('ciudad_cliente', 100)->nullable();
            $table->decimal('limite_credito', 10, 2)->default(0);
            $table->boolean('estado')->default(1);
            $table->timestamps();

            $table->foreign('id_empresa')
                  ->references('id_empresa')
                  ->on('empresas')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};
