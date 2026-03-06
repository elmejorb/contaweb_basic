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
        Schema::create('compras', function (Blueprint $table) {
            $table->id('id_compra');
            $table->unsignedBigInteger('id_empresa');
            $table->unsignedBigInteger('id_proveedor');
            $table->unsignedBigInteger('id_usuario');
            $table->string('numero_factura', 50);
            $table->date('fecha_compra');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('total_impuestos', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->string('forma_pago', 20);
            $table->text('observaciones')->nullable();
            $table->string('sincronizado', 1)->default('N');
            $table->timestamps();

            $table->foreign('id_empresa')
                  ->references('id_empresa')
                  ->on('empresas')
                  ->onDelete('cascade');
            $table->foreign('id_proveedor')
                  ->references('id_proveedor')
                  ->on('proveedores')
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
        Schema::dropIfExists('compras');
    }
};
