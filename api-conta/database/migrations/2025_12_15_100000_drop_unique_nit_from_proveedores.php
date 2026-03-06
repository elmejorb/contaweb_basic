<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Elimina el constraint UNIQUE de (id_empresa, nit) para permitir
     * sincronización de proveedores desde VB6 con NITs vacíos o duplicados.
     * El identificador único real es codvb6.
     */
    public function up(): void
    {
        Schema::table('proveedores', function (Blueprint $table) {
            // Eliminar el constraint unique de (id_empresa, nit)
            $table->dropUnique(['id_empresa', 'nit']);

            // Mantener solo un índice normal para búsquedas
            $table->index('nit', 'proveedores_nit_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proveedores', function (Blueprint $table) {
            $table->dropIndex('proveedores_nit_index');
            $table->unique(['id_empresa', 'nit']);
        });
    }
};
