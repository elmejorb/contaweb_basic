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
        DB::statement('ALTER TABLE proveedores CHANGE nombre_proveedor razon_social VARCHAR(200)');
        DB::statement('ALTER TABLE proveedores CHANGE nit_proveedor nit VARCHAR(50)');
        DB::statement('ALTER TABLE proveedores CHANGE telefono_proveedor telefono VARCHAR(50)');
        DB::statement('ALTER TABLE proveedores CHANGE email_proveedor email VARCHAR(100)');
        DB::statement('ALTER TABLE proveedores CHANGE direccion_proveedor direccion TEXT');
        DB::statement('ALTER TABLE proveedores DROP COLUMN ciudad_proveedor');

        // Paso 2: Agregar nuevos campos
        Schema::table('proveedores', function (Blueprint $table) {
            // Agregar código de proveedor
            $table->string('codigo_proveedor', 50)->nullable()->after('id_empresa');

            // Datos de contacto
            $table->string('contacto_nombres', 100)->nullable()->after('direccion');
            $table->string('contacto_apellidos', 100)->nullable()->after('contacto_nombres');
            $table->string('contacto_identificacion', 50)->nullable()->after('contacto_apellidos');
            $table->string('contacto_telefono', 50)->nullable()->after('contacto_identificacion');
            $table->string('contacto_direccion', 255)->nullable()->after('contacto_telefono');

            // Número de cuentas de banco
            $table->text('numero_cuentas_banco')->nullable()->after('contacto_direccion');
        });

        // Paso 3: Agregar índices
        Schema::table('proveedores', function (Blueprint $table) {
            $table->unique(['id_empresa', 'nit']);
            $table->index('razon_social');
            $table->index('codigo_proveedor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proveedores', function (Blueprint $table) {
            // Eliminar índices
            $table->dropUnique(['id_empresa', 'nit']);
            $table->dropIndex(['razon_social']);
            $table->dropIndex(['codigo_proveedor']);

            // Eliminar columnas agregadas
            $table->dropColumn([
                'codigo_proveedor',
                'contacto_nombres',
                'contacto_apellidos',
                'contacto_identificacion',
                'contacto_telefono',
                'contacto_direccion',
                'numero_cuentas_banco'
            ]);
        });

        // Revertir nombres de columnas usando DB::statement para MariaDB
        DB::statement('ALTER TABLE proveedores CHANGE razon_social nombre_proveedor VARCHAR(200)');
        DB::statement('ALTER TABLE proveedores CHANGE nit nit_proveedor VARCHAR(50)');
        DB::statement('ALTER TABLE proveedores CHANGE telefono telefono_proveedor VARCHAR(50)');
        DB::statement('ALTER TABLE proveedores CHANGE email email_proveedor VARCHAR(100)');
        DB::statement('ALTER TABLE proveedores CHANGE direccion direccion_proveedor TEXT');

        Schema::table('proveedores', function (Blueprint $table) {
            $table->string('ciudad_proveedor', 100)->nullable();
        });
    }
};
