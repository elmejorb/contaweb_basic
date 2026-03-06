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
            $table->string('codvb6_producto', 50)->nullable()->after('id_producto');
            $table->decimal('descuento', 10, 2)->default(0)->after('subtotal');
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
            $table->dropColumn(['codvb6_producto', 'descuento']);
        });
    }
};
