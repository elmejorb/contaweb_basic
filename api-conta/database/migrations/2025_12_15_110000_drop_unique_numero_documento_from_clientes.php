<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Elimina el constraint UNIQUE de (id_empresa, numero_documento) para permitir
     * sincronización de clientes desde VB6 con documentos vacíos o duplicados.
     * El identificador único real es codvb6.
     */
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            // Eliminar el constraint unique de (id_empresa, numero_documento)
            $table->dropUnique(['id_empresa', 'numero_documento']);

            // Mantener solo un índice normal para búsquedas
            $table->index('numero_documento', 'clientes_numero_documento_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropIndex('clientes_numero_documento_index');
            $table->unique(['id_empresa', 'numero_documento']);
        });
    }
};
