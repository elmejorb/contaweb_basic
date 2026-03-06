<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tipos_usuario', function (Blueprint $table) {
            $table->id('id_tipo_usuario');
            $table->string('nombre_tipo', 50);
            $table->timestamps();
        });

        // Insertar tipos por defecto
        DB::table('tipos_usuario')->insert([
            ['nombre_tipo' => 'Administrador', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['nombre_tipo' => 'Usuario', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipos_usuario');
    }
};
