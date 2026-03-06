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
        if (Schema::hasTable('consecutivos_facturacion')) {
            return;
        }

        Schema::create('consecutivos_facturacion', function (Blueprint $table) {
            $table->id('id_consecutivo');
            $table->unsignedBigInteger('id_empresa');
            $table->unsignedBigInteger('id_tipo_documento');
            $table->string('prefijo', 10)->nullable(); // FE, FW, DE, etc.
            $table->bigInteger('numero_inicial')->default(1);
            $table->bigInteger('numero_actual')->default(0);
            $table->bigInteger('numero_final')->nullable(); // Para rangos autorizados DIAN
            $table->date('fecha_autorizacion')->nullable(); // Para FE
            $table->date('fecha_vencimiento')->nullable(); // Para FE
            $table->string('resolucion_dian', 100)->nullable(); // Número de resolución DIAN
            $table->boolean('estado')->default(true);
            $table->timestamps();

            // Índice único: una empresa no puede tener dos consecutivos iguales del mismo tipo/prefijo
            $table->unique(['id_empresa', 'id_tipo_documento', 'prefijo'], 'consecutivo_empresa_tipo_prefijo_unique');

            // Foreign keys
            $table->foreign('id_empresa')->references('id_empresa')->on('empresas')->onDelete('cascade');
            $table->foreign('id_tipo_documento')->references('id_tipo_documento')->on('tipos_documento_facturacion')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('consecutivos_facturacion');
    }
};
