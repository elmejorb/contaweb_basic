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
        Schema::create('estados_factura', function (Blueprint $table) {
            $table->id('id_estado');
            $table->string('nombre_estado', 50);
            $table->string('color', 20)->nullable();
            $table->timestamps();
        });

        // Insertar estados por defecto
        \DB::table('estados_factura')->insert([
            ['nombre_estado' => 'Pendiente', 'color' => 'warning', 'created_at' => \Carbon\Carbon::now(), 'updated_at' => \Carbon\Carbon::now()],
            ['nombre_estado' => 'Pagada', 'color' => 'success', 'created_at' => \Carbon\Carbon::now(), 'updated_at' => \Carbon\Carbon::now()],
            ['nombre_estado' => 'Anulada', 'color' => 'danger', 'created_at' => \Carbon\Carbon::now(), 'updated_at' => \Carbon\Carbon::now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estados_factura');
    }
};
