<?php

namespace App\Http\Controllers;

use App\Models\TipoDocumento;
use App\Models\TipoResponsabilidad;
use App\Models\TipoOrganizacion;
use App\Models\TipoRegimen;
use Illuminate\Http\Request;

class CatalogoController extends Controller
{
    /**
     * Obtener todos los tipos de documentos
     */
    public function tiposDocumentos()
    {
        try {
            $tipos = TipoDocumento::orderBy('name')->get();

            return response()->json([
                'error' => false,
                'datos' => $tipos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener tipos de documentos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todos los tipos de responsabilidades fiscales
     */
    public function tiposResponsabilidades()
    {
        try {
            $tipos = TipoResponsabilidad::orderBy('code')->get();

            return response()->json([
                'error' => false,
                'datos' => $tipos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener tipos de responsabilidades: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todos los tipos de organizaciones (adquirientes)
     */
    public function tiposOrganizaciones()
    {
        try {
            $tipos = TipoOrganizacion::orderBy('code')->get();

            return response()->json([
                'error' => false,
                'datos' => $tipos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener tipos de organizaciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todos los regímenes tributarios
     */
    public function regimenesTributarios()
    {
        try {
            $regimenes = TipoRegimen::orderBy('code')->get();

            return response()->json([
                'error' => false,
                'datos' => $regimenes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener regímenes tributarios: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todos los catálogos en una sola petición
     */
    public function todos()
    {
        try {
            return response()->json([
                'error' => false,
                'catalogos' => [
                    'tipos_documentos' => TipoDocumento::orderBy('name')->get(),
                    'tipos_responsabilidades' => TipoResponsabilidad::orderBy('code')->get(),
                    'tipos_organizaciones' => TipoOrganizacion::orderBy('code')->get(),
                    'regimenes_tributarios' => TipoRegimen::orderBy('code')->get()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener catálogos: ' . $e->getMessage()
            ], 500);
        }
    }
}
