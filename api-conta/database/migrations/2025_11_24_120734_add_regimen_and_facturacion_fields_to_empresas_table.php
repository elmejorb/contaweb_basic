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
        Schema::table('empresas', function (Blueprint $table) {
            $table->text('descripcion_empresa')->nullable()->after('email_empresa');
            $table->enum('regimen_empresa', ['Simplificado', 'Comun'])->default('Simplificado')->after('descripcion_empresa');
            $table->string('resolucion_facturacion', 100)->nullable()->after('regimen_empresa');
            $table->date('fecha_resolucion')->nullable()->after('resolucion_facturacion');
            $table->string('prefijo_factura', 10)->nullable()->after('fecha_resolucion');
            $table->bigInteger('rango_desde')->nullable()->after('prefijo_factura');
            $table->bigInteger('rango_hasta')->nullable()->after('rango_desde');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn([
                'descripcion_empresa',
                'regimen_empresa',
                'resolucion_facturacion',
                'fecha_resolucion',
                'prefijo_factura',
                'rango_desde',
                'rango_hasta'
            ]);
        });
    }
};
