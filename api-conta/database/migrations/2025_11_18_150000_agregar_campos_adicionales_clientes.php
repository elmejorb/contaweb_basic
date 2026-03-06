<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Paso 1: Renombrar columnas existentes usando DB::statement para MariaDB
        DB::statement('ALTER TABLE clientes CHANGE nombre_cliente nombre_razon_social VARCHAR(200)');
        DB::statement('ALTER TABLE clientes CHANGE telefono_cliente telefono VARCHAR(50)');
        DB::statement('ALTER TABLE clientes CHANGE email_cliente email VARCHAR(100)');
        DB::statement('ALTER TABLE clientes CHANGE direccion_cliente direccion TEXT');
        DB::statement('ALTER TABLE clientes CHANGE ciudad_cliente municipio VARCHAR(100)');
        DB::statement('ALTER TABLE clientes CHANGE limite_credito cupo_autorizado DECIMAL(10,2) DEFAULT 0');

        // Paso 2: Agregar nuevos campos
        Schema::table('clientes', function (Blueprint $table) {
            // Agregar código de cliente
            $table->string('codigo_cliente', 50)->nullable()->after('id_empresa');

            // Agregar dígito de verificación
            $table->string('digito_verificacion', 2)->nullable()->after('numero_documento');

            // Agregar nuevos campos de contacto
            $table->string('celular', 50)->nullable()->after('telefono');
            $table->string('whatsapp', 50)->nullable()->after('celular');
            $table->string('departamento', 100)->nullable()->after('direccion');
            $table->date('fecha_nacimiento')->nullable()->after('municipio');

            // Datos fiscales
            $table->string('tipo_responsabilidad', 50)->nullable()->after('fecha_nacimiento');
            $table->string('tipo_adquiriente', 50)->nullable()->after('tipo_responsabilidad');
            $table->string('regimen_tributario', 50)->nullable()->after('tipo_adquiriente');

            // Datos de contacto adicional
            $table->string('contacto_nombres', 100)->nullable()->after('regimen_tributario');
            $table->string('contacto_apellidos', 100)->nullable()->after('contacto_nombres');
            $table->string('contacto_telefono', 50)->nullable()->after('contacto_apellidos');
            $table->string('contacto_direccion', 255)->nullable()->after('contacto_telefono');

            // Datos comerciales
            $table->unsignedBigInteger('id_vendedor')->nullable()->after('cupo_autorizado');
            $table->boolean('factura_precio_costo')->default(false)->after('id_vendedor');
            $table->boolean('facturar_con_vencimientos')->default(false)->after('factura_precio_costo');
            $table->boolean('facturar_solo_contado')->default(false)->after('facturar_con_vencimientos');
        });

        // Paso 3: Modificar el tipo de dato de cupo_autorizado
        Schema::table('clientes', function (Blueprint $table) {
            $table->decimal('cupo_autorizado', 15, 2)->default(0)->change();
        });

        // Paso 4: Agregar índices y claves foráneas
        Schema::table('clientes', function (Blueprint $table) {
            $table->foreign('id_vendedor')->references('id_usuario')->on('usuarios')->onDelete('set null');
            $table->unique(['id_empresa', 'numero_documento']);
            $table->index('nombre_razon_social');
            $table->index('codigo_cliente');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            // Eliminar índices y claves foráneas
            $table->dropForeign(['id_vendedor']);
            $table->dropUnique(['id_empresa', 'numero_documento']);
            $table->dropIndex(['nombre_razon_social']);
            $table->dropIndex(['codigo_cliente']);

            // Eliminar columnas agregadas
            $table->dropColumn([
                'codigo_cliente',
                'digito_verificacion',
                'celular',
                'whatsapp',
                'departamento',
                'fecha_nacimiento',
                'tipo_responsabilidad',
                'tipo_adquiriente',
                'regimen_tributario',
                'contacto_nombres',
                'contacto_apellidos',
                'contacto_telefono',
                'contacto_direccion',
                'id_vendedor',
                'factura_precio_costo',
                'facturar_con_vencimientos',
                'facturar_solo_contado'
            ]);
        });

        // Revertir nombres de columnas usando DB::statement para MariaDB
        DB::statement('ALTER TABLE clientes CHANGE nombre_razon_social nombre_cliente VARCHAR(200)');
        DB::statement('ALTER TABLE clientes CHANGE telefono telefono_cliente VARCHAR(50)');
        DB::statement('ALTER TABLE clientes CHANGE email email_cliente VARCHAR(100)');
        DB::statement('ALTER TABLE clientes CHANGE direccion direccion_cliente TEXT');
        DB::statement('ALTER TABLE clientes CHANGE municipio ciudad_cliente VARCHAR(100)');
        DB::statement('ALTER TABLE clientes CHANGE cupo_autorizado limite_credito DECIMAL(10,2) DEFAULT 0');
    }
};
