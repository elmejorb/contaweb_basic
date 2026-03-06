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
        Schema::table('productos', function (Blueprint $table) {
            // Agregar columnas para los 4 precios de venta
            $table->decimal('precio_venta_2', 10, 2)->default(0)->after('precio_venta');
            $table->decimal('precio_venta_3', 10, 2)->default(0)->after('precio_venta_2');
            $table->decimal('precio_venta_4', 10, 2)->default(0)->after('precio_venta_3');
            $table->decimal('precio_minimo', 10, 2)->default(0)->after('precio_venta_4');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropColumn(['precio_venta_2', 'precio_venta_3', 'precio_venta_4', 'precio_minimo']);
        });
    }
};
