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
        Schema::table('detalles_venta', function (Blueprint $table) {
            $table->string('descripcion_temp', 100)->nullable()->after('codvb6_producto'); // DescripcionTemp
            $table->decimal('precio_costo', 19, 4)->default(0)->after('precio_unitario'); // PrecioC
            $table->decimal('porcentaje_iva', 5, 2)->default(0)->after('impuesto'); // IVA (%)
            $table->float('cantidad_devolucion')->default(0)->after('cantidad'); // Dev
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('detalles_venta', function (Blueprint $table) {
            $table->dropColumn(['descripcion_temp', 'precio_costo', 'porcentaje_iva', 'cantidad_devolucion']);
        });
    }
};
