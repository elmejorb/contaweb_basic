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
        Schema::create('productos', function (Blueprint $table) {
            $table->id('id_producto');
            $table->unsignedBigInteger('id_empresa');
            $table->unsignedBigInteger('id_categoria')->nullable();
            $table->unsignedBigInteger('id_impuesto')->nullable();
            $table->string('codigo_producto', 50);
            $table->string('nombre_producto', 200);
            $table->text('descripcion_producto')->nullable();
            $table->decimal('precio_compra', 10, 2)->default(0);
            $table->decimal('precio_venta', 10, 2);
            $table->integer('stock_actual')->default(0);
            $table->integer('stock_minimo')->default(0);
            $table->string('unidad_medida', 20)->nullable();
            $table->string('imagen_producto')->nullable();
            $table->boolean('maneja_inventario')->default(1);
            $table->boolean('estado')->default(1);
            $table->timestamps();

            $table->foreign('id_empresa')
                  ->references('id_empresa')
                  ->on('empresas')
                  ->onDelete('cascade');
            $table->foreign('id_categoria')
                  ->references('id_categoria')
                  ->on('categorias')
                  ->onDelete('set null');
            $table->foreign('id_impuesto')
                  ->references('id_impuesto')
                  ->on('impuestos')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};
