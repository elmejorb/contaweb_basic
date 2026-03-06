<?php

namespace App\Http\Controllers;

use App\Models\Impuesto;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;

class ImpuestoController extends Controller
{
    /**
     * Listar impuestos con paginación, búsqueda y filtros
     */
    public function index(Request $request)
    {
        try {
            $query = Impuesto::query();

            // Búsqueda por nombre
            if ($request->has('search') && $request->search != '') {
                $query->where('nombre_impuesto', 'like', '%' . $request->search . '%');
            }

            // Filtro por estado
            if ($request->has('estado') && $request->estado !== null) {
                $query->where('estado', $request->estado);
            }

            // Ordenamiento
            $sortBy = $request->input('sortBy', 'nombre_impuesto');
            $sortOrder = $request->input('sortOrder', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginación
            $perPage = $request->input('per_page', 15);
            $impuestos = $query->paginate($perPage);

            return response()->json([
                'error' => false,
                'impuestos' => $impuestos->items(),
                'total' => $impuestos->total(),
                'per_page' => $impuestos->perPage(),
                'current_page' => $impuestos->currentPage(),
                'last_page' => $impuestos->lastPage(),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener los impuestos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener un impuesto específico
     */
    public function show($id)
    {
        try {
            $impuesto = Impuesto::findOrFail($id);

            return response()->json([
                'error' => false,
                'impuesto' => $impuesto
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Impuesto no encontrado'
            ], 404);
        }
    }

    /**
     * Crear un nuevo impuesto
     */
    public function store(Request $request)
    {
        try {
            // Validación
            $this->validate($request, [
                'nombre_impuesto' => 'required|string|max:50|unique:impuestos,nombre_impuesto',
                'porcentaje' => 'required|numeric|min:0|max:999.99',
                'estado' => 'boolean'
            ], [
                'nombre_impuesto.required' => 'El nombre del impuesto es obligatorio',
                'nombre_impuesto.unique' => 'Ya existe un impuesto con ese nombre',
                'porcentaje.required' => 'El porcentaje es obligatorio',
                'porcentaje.numeric' => 'El porcentaje debe ser un número',
                'porcentaje.min' => 'El porcentaje no puede ser negativo',
                'porcentaje.max' => 'El porcentaje no puede ser mayor a 999.99',
            ]);

            $impuesto = Impuesto::create([
                'nombre_impuesto' => $request->nombre_impuesto,
                'porcentaje' => $request->porcentaje,
                'estado' => $request->input('estado', 1)
            ]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Impuesto creado exitosamente',
                'impuesto' => $impuesto
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error de validación',
                'errores' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear el impuesto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un impuesto existente
     */
    public function update(Request $request, $id)
    {
        try {
            $impuesto = Impuesto::findOrFail($id);

            // Validación
            $this->validate($request, [
                'nombre_impuesto' => 'required|string|max:50|unique:impuestos,nombre_impuesto,' . $id . ',id_impuesto',
                'porcentaje' => 'required|numeric|min:0|max:999.99',
                'estado' => 'boolean'
            ], [
                'nombre_impuesto.required' => 'El nombre del impuesto es obligatorio',
                'nombre_impuesto.unique' => 'Ya existe un impuesto con ese nombre',
                'porcentaje.required' => 'El porcentaje es obligatorio',
                'porcentaje.numeric' => 'El porcentaje debe ser un número',
                'porcentaje.min' => 'El porcentaje no puede ser negativo',
                'porcentaje.max' => 'El porcentaje no puede ser mayor a 999.99',
            ]);

            $impuesto->update([
                'nombre_impuesto' => $request->nombre_impuesto,
                'porcentaje' => $request->porcentaje,
                'estado' => $request->input('estado', $impuesto->estado)
            ]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Impuesto actualizado exitosamente',
                'impuesto' => $impuesto
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error de validación',
                'errores' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar el impuesto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar (desactivar) un impuesto
     */
    public function destroy($id)
    {
        try {
            $impuesto = Impuesto::findOrFail($id);

            // Soft delete: cambiar estado a 0
            $impuesto->update(['estado' => 0]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Impuesto desactivado exitosamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al desactivar el impuesto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar un impuesto desactivado
     */
    public function restore($id)
    {
        try {
            $impuesto = Impuesto::findOrFail($id);

            $impuesto->update(['estado' => 1]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Impuesto restaurado exitosamente',
                'impuesto' => $impuesto
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al restaurar el impuesto: ' . $e->getMessage()
            ], 500);
        }
    }
}
