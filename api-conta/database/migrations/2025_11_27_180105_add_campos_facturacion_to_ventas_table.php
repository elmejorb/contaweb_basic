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
        Schema::table('ventas', function (Blueprint $table) {
            // Tipo de documento y origen
            $table->unsignedBigInteger('id_tipo_documento')->nullable()->after('id_estado');
            $table->string('codvb6', 50)->nullable()->after('id_tipo_documento'); // Código original de VB6

            // Campos para factura electrónica
            $table->boolean('es_electronica')->default(false)->after('codvb6');
            $table->string('prefijo_fe', 10)->nullable()->after('es_electronica'); // Prefijo factura electrónica
            $table->bigInteger('numero_fe')->nullable()->after('prefijo_fe'); // Número consecutivo FE
            $table->string('cufe', 255)->nullable()->after('numero_fe'); // Código único de factura electrónica
            $table->string('qr_code', 500)->nullable()->after('cufe'); // Código QR de la FE
            $table->string('estado_fe', 30)->nullable()->after('qr_code'); // pendiente, enviada, aceptada, rechazada
            $table->timestamp('fecha_envio_dian')->nullable()->after('estado_fe');
            $table->timestamp('fecha_respuesta_dian')->nullable()->after('fecha_envio_dian');
            $table->text('respuesta_dian')->nullable()->after('fecha_respuesta_dian'); // Respuesta JSON de DIAN

            // Control de edición
            $table->boolean('editable')->default(true)->after('respuesta_dian');

            // Foreign key
            $table->foreign('id_tipo_documento')->references('id_tipo_documento')->on('tipos_documento_facturacion')->onDelete('set null');

            // Índices
            $table->index('codvb6');
            $table->index('cufe');
            $table->index(['id_empresa', 'id_tipo_documento']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->dropForeign(['id_tipo_documento']);
            $table->dropIndex(['codvb6']);
            $table->dropIndex(['cufe']);
            $table->dropIndex(['id_empresa', 'id_tipo_documento']);

            $table->dropColumn([
                'id_tipo_documento',
                'codvb6',
                'es_electronica',
                'prefijo_fe',
                'numero_fe',
                'cufe',
                'qr_code',
                'estado_fe',
                'fecha_envio_dian',
                'fecha_respuesta_dian',
                'respuesta_dian',
                'editable'
            ]);
        });
    }
};
