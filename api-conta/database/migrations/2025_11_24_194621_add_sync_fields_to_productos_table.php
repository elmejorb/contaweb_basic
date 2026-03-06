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
        // Verificar y agregar codvb6 si no existe
        if (!Schema::hasColumn('productos', 'codvb6')) {
            Schema::table('productos', function (Blueprint $table) {
                $table->string('codvb6', 50)->nullable()->after('id_producto');
            });
        }

        // Verificar y agregar es_servicio si no existe
        if (!Schema::hasColumn('productos', 'es_servicio')) {
            Schema::table('productos', function (Blueprint $table) {
                $table->boolean('es_servicio')->default(0)->after('maneja_inventario');
            });
        }

        // Verificar y agregar nombre_corto si no existe
        if (!Schema::hasColumn('productos', 'nombre_corto')) {
            Schema::table('productos', function (Blueprint $table) {
                $table->string('nombre_corto', 100)->nullable()->after('nombre_producto');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropIndex(['id_empresa', 'codvb6']);
            $table->dropColumn(['codvb6', 'es_servicio', 'nombre_corto']);
        });
    }
};
