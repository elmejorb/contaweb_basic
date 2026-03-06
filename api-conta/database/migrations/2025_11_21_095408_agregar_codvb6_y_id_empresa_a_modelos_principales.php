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
        // Agregar campos a Categorías
        Schema::table('categorias', function (Blueprint $table) {
            $table->unsignedBigInteger('id_empresa')->after('id_categoria')->nullable();
            $table->string('codvb6', 50)->nullable()->after('id_empresa')->comment('Código del registro en Visual Basic 6');

            // Índices para mejorar rendimiento
            $table->index('id_empresa');
            $table->index('codvb6');
            $table->unique(['id_empresa', 'codvb6'], 'unique_categoria_empresa_codvb6');

            // Relación con empresa
            $table->foreign('id_empresa')->references('id_empresa')->on('empresas')->onDelete('cascade');
        });

        // Agregar codvb6 a Productos
        Schema::table('productos', function (Blueprint $table) {
            $table->string('codvb6', 50)->nullable()->after('id_empresa')->comment('Código del registro en Visual Basic 6');

            $table->index('codvb6');
            $table->unique(['id_empresa', 'codvb6'], 'unique_producto_empresa_codvb6');
        });

        // Agregar codvb6 a Clientes
        Schema::table('clientes', function (Blueprint $table) {
            $table->string('codvb6', 50)->nullable()->after('id_empresa')->comment('Código del registro en Visual Basic 6');

            $table->index('codvb6');
            $table->unique(['id_empresa', 'codvb6'], 'unique_cliente_empresa_codvb6');
        });

        // Agregar codvb6 a Proveedores
        Schema::table('proveedores', function (Blueprint $table) {
            $table->string('codvb6', 50)->nullable()->after('id_empresa')->comment('Código del registro en Visual Basic 6');

            $table->index('codvb6');
            $table->unique(['id_empresa', 'codvb6'], 'unique_proveedor_empresa_codvb6');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir cambios en Categorías
        Schema::table('categorias', function (Blueprint $table) {
            $table->dropForeign(['id_empresa']);
            $table->dropUnique('unique_categoria_empresa_codvb6');
            $table->dropIndex(['id_empresa']);
            $table->dropIndex(['codvb6']);
            $table->dropColumn(['id_empresa', 'codvb6']);
        });

        // Revertir cambios en Productos
        Schema::table('productos', function (Blueprint $table) {
            $table->dropUnique('unique_producto_empresa_codvb6');
            $table->dropIndex(['codvb6']);
            $table->dropColumn('codvb6');
        });

        // Revertir cambios en Clientes
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropUnique('unique_cliente_empresa_codvb6');
            $table->dropIndex(['codvb6']);
            $table->dropColumn('codvb6');
        });

        // Revertir cambios en Proveedores
        Schema::table('proveedores', function (Blueprint $table) {
            $table->dropUnique('unique_proveedor_empresa_codvb6');
            $table->dropIndex(['codvb6']);
            $table->dropColumn('codvb6');
        });
    }
};
