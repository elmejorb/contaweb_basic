<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuarios_empresas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_usuario')->constrained('usuarios', 'id_usuario')->onDelete('cascade');
            $table->foreignId('id_empresa')->constrained('empresas', 'id_empresa')->onDelete('cascade');
            $table->timestamps();
            $table->unique(['id_usuario', 'id_empresa']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuarios_empresas');
    }
};
