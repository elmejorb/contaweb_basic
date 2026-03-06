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
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id('id_usuario');
            $table->string('nombre_us', 100);
            $table->string('email_us', 100)->unique();
            $table->string('password_us')->nullable();
            $table->string('avatar')->nullable();
            $table->foreignId('id_tipo_usuario')->constrained('tipos_usuario', 'id_tipo_usuario');
            $table->string('tipologin', 1)->default('r')->comment('r=registro, g=google, f=facebook');
            $table->string('uid')->nullable()->comment('UID para auth social');
            $table->string('token_us')->nullable();
            $table->char('email_validado', 1)->default('N');
            $table->string('email_token')->nullable();
            $table->tinyInteger('estado_us')->default(0)->comment('0=inactivo, 1=activo');
            $table->char('cambio_password', 1)->default('N');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};
