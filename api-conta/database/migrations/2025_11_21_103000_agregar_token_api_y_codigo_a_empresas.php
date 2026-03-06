<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Verificar si las columnas ya existen antes de agregarlas
        if (!Schema::hasColumn('empresas', 'codigo_empresa')) {
            Schema::table('empresas', function (Blueprint $table) {
                // Código único de empresa (alfanumérico corto)
                $table->string('codigo_empresa', 20)->nullable()->after('id_empresa')->unique();
            });
        }

        if (!Schema::hasColumn('empresas', 'token_api')) {
            Schema::table('empresas', function (Blueprint $table) {
                // Token API para sincronización VB6
                $table->string('token_api', 64)->nullable()->after('codigo_empresa')->unique();
            });
        }

        // Agregar índices (ignorando si ya existen)
        try {
            Schema::table('empresas', function (Blueprint $table) {
                $table->index('codigo_empresa', 'empresas_codigo_empresa_index');
            });
        } catch (\Exception $e) {
            // Índice ya existe, continuar
        }

        try {
            Schema::table('empresas', function (Blueprint $table) {
                $table->index('token_api', 'empresas_token_api_index');
            });
        } catch (\Exception $e) {
            // Índice ya existe, continuar
        }

        // Generar códigos y tokens para empresas existentes que no los tengan
        $empresas = DB::table('empresas')
            ->whereNull('codigo_empresa')
            ->orWhereNull('token_api')
            ->get();

        foreach ($empresas as $empresa) {
            $updates = [];

            if (empty($empresa->codigo_empresa)) {
                $updates['codigo_empresa'] = 'EMP' . str_pad($empresa->id_empresa, 4, '0', STR_PAD_LEFT);
            }

            if (empty($empresa->token_api)) {
                $updates['token_api'] = bin2hex(random_bytes(32));
            }

            if (!empty($updates)) {
                DB::table('empresas')
                    ->where('id_empresa', $empresa->id_empresa)
                    ->update($updates);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropIndex(['codigo_empresa']);
            $table->dropIndex(['token_api']);
            $table->dropColumn(['codigo_empresa', 'token_api']);
        });
    }
};
