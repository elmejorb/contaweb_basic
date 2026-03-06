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
        Schema::create('empresas', function (Blueprint $table) {
            $table->id('id_empresa');
            $table->string('nombre_empresa', 200);
            $table->string('nit_empresa', 50);
            $table->string('telefono_empresa', 50)->nullable();
            $table->string('direccion_empresa')->nullable();
            $table->string('email_empresa', 100)->nullable();
            $table->string('logo_empresa')->nullable();
            $table->string('token_access')->nullable()->comment('Token para sincronización VB6');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('empresas');
    }
};
