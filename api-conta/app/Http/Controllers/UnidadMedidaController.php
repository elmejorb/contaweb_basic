<?php

namespace App\Http\Controllers;

use App\Models\UnidadMedida;
use Illuminate\Http\Request;

class UnidadMedidaController extends Controller
{
    /**
     * Listar unidades de medida con paginación y búsqueda
     */
    public function index(Request $request)
    {
        try {
            $query = UnidadMedida::query();

            // Búsqueda por nombre o código
            if ($request->has('search') && $request->search != '') {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('code', 'like', '%' . $search . '%');
                });
            }

            // Ordenamiento
            $sortBy = $request->input('sortBy', 'name');
            $sortOrder = $request->input('sortOrder', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginación
            $perPage = $request->input('per_page', 25);
            $unidades = $query->paginate($perPage);

            return response()->json([
                'error' => false,
                'unidades' => $unidades->items(),
                'total' => $unidades->total(),
                'per_page' => $unidades->perPage(),
                'current_page' => $unidades->currentPage(),
                'last_page' => $unidades->lastPage(),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener las unidades de medida: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener una unidad de medida específica
     */
    public function show($id)
    {
        try {
            $unidad = UnidadMedida::findOrFail($id);

            return response()->json([
                'error' => false,
                'unidad' => $unidad
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Unidad de medida no encontrada'
            ], 404);
        }
    }

    /**
     * Buscar unidad de medida por código
     */
    public function buscarPorCodigo($codigo)
    {
        try {
            $unidad = UnidadMedida::where('code', $codigo)->first();

            if (!$unidad) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Unidad de medida no encontrada con el código: ' . $codigo
                ], 404);
            }

            return response()->json([
                'error' => false,
                'unidad' => $unidad
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al buscar la unidad de medida: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todas las unidades (sin paginación) para usar en selects
     */
    public function todas()
    {
        try {
            $unidades = UnidadMedida::orderBy('name', 'asc')->get();

            return response()->json([
                'error' => false,
                'unidades' => $unidades
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener las unidades de medida: ' . $e->getMessage()
            ], 500);
        }
    }
}
