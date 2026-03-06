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
     *
     * @return void
     */
    public function up()
    {
        // Verificar si la tabla ya existe
        if (Schema::hasTable('tipos_documento_facturacion')) {
            return;
        }

        Schema::create('tipos_documento_facturacion', function (Blueprint $table) {
            $table->id('id_tipo_documento');
            $table->string('codigo', 20)->unique(); // VB6, WEB, FE, DE, etc.
            $table->string('nombre', 100); // Factura VB6, Factura Web, Factura Electrónica, etc.
            $table->string('descripcion', 255)->nullable();
            $table->boolean('es_electronica')->default(false); // true para FE
            $table->boolean('es_sincronizable')->default(false); // true para VB6
            $table->boolean('es_editable')->default(true); // false para VB6
            $table->boolean('requiere_consecutivo_propio')->default(true);
            $table->string('prefijo_defecto', 10)->nullable(); // Prefijo por defecto
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        // Insertar tipos de documento por defecto
        DB::table('tipos_documento_facturacion')->insert([
            [
                'codigo' => 'VB6',
                'nombre' => 'Factura Software Local',
                'descripcion' => 'Facturas sincronizadas desde el software de escritorio VB6',
                'es_electronica' => false,
                'es_sincronizable' => true,
                'es_editable' => false,
                'requiere_consecutivo_propio' => false,
                'prefijo_defecto' => null,
                'estado' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'codigo' => 'WEB',
                'nombre' => 'Factura Web',
                'descripcion' => 'Facturas creadas directamente en la plataforma web',
                'es_electronica' => false,
                'es_sincronizable' => false,
                'es_editable' => true,
                'requiere_consecutivo_propio' => true,
                'prefijo_defecto' => 'FW',
                'estado' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'codigo' => 'FE',
                'nombre' => 'Factura Electrónica',
                'descripcion' => 'Factura electrónica con validación DIAN',
                'es_electronica' => true,
                'es_sincronizable' => false,
                'es_editable' => false,
                'requiere_consecutivo_propio' => true,
                'prefijo_defecto' => 'FE',
                'estado' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ],
            [
                'codigo' => 'DE',
                'nombre' => 'Documento Equivalente',
                'descripcion' => 'Documento equivalente a factura para operaciones que no requieren factura legal',
                'es_electronica' => false,
                'es_sincronizable' => false,
                'es_editable' => true,
                'requiere_consecutivo_propio' => true,
                'prefijo_defecto' => 'DE',
                'estado' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('tipos_documento_facturacion');
    }
};
