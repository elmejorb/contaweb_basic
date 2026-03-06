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
        Schema::create('proveedores', function (Blueprint $table) {
            $table->id('id_proveedor');
            $table->unsignedBigInteger('id_empresa');
            $table->string('nombre_proveedor', 200);
            $table->string('nit_proveedor', 50)->nullable();
            $table->string('telefono_proveedor', 50)->nullable();
            $table->string('email_proveedor', 100)->nullable();
            $table->text('direccion_proveedor')->nullable();
            $table->string('ciudad_proveedor', 100)->nullable();
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
        Schema::dropIfExists('proveedores');
    }
};
