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
        Schema::table('empresas', function (Blueprint $table) {
            $table->string('token_crm', 255)->nullable()->comment('Token único del CRM para validación');
            $table->unsignedBigInteger('id_cliente_crm')->nullable()->comment('ID del cliente en el CRM');
            $table->string('plan_actual', 100)->nullable()->comment('Plan de suscripción actual');
            $table->date('fecha_vencimiento_plan')->nullable()->comment('Fecha de vencimiento del plan');
            $table->string('estado_suscripcion', 50)->default('inactivo')->comment('activo, inactivo, vencido, suspendido');
            $table->json('modulos_habilitados')->nullable()->comment('Array de módulos que el plan tiene habilitados');
            $table->timestamp('ultima_validacion_crm')->nullable()->comment('Última vez que se validó con el CRM');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn([
                'token_crm',
                'id_cliente_crm',
                'plan_actual',
                'fecha_vencimiento_plan',
                'estado_suscripcion',
                'modulos_habilitados',
                'ultima_validacion_crm'
            ]);
        });
    }
};
