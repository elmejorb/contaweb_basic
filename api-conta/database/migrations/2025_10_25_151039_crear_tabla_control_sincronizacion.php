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
        Schema::create('control_sincronizacion', function (Blueprint $table) {
            $table->id('id_sincronizacion');
            $table->unsignedBigInteger('id_empresa');
            $table->string('tabla', 50);
            $table->unsignedBigInteger('id_registro');
            $table->string('accion', 20); // insert, update, delete
            $table->dateTime('fecha_sincronizacion');
            $table->string('origen', 10); // local, remoto
            $table->boolean('procesado')->default(0);
            $table->timestamps();

            $table->foreign('id_empresa')
                  ->references('id_empresa')
                  ->on('empresas')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('control_sincronizacion');
    }
};
