<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('categorias', function (Blueprint $table) {
            // Agregar id_empresa con foreign key
            $table->unsignedBigInteger('id_empresa')->nullable()->after('id_categoria');
            $table->foreign('id_empresa')->references('id_empresa')->on('empresas')->onDelete('cascade');

            // Agregar código VB6 para sincronización
            $table->string('codvb6', 50)->nullable()->after('id_empresa');

            // Índice para búsquedas rápidas
            $table->index(['id_empresa', 'codvb6']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('categorias', function (Blueprint $table) {
            $table->dropForeign(['id_empresa']);
            $table->dropIndex(['id_empresa', 'codvb6']);
            $table->dropColumn(['id_empresa', 'codvb6']);
        });
    }
};
