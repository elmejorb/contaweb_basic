<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Helpers\EncodingHelper;

class CategoriaController extends Controller
{
    /**
     * Listar todas las categorías
     */
    public function index(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $query = Categoria::query();

            // Filtrar por empresa del usuario (o por empresa del request si se proporciona)
            $id_empresa = $request->get('id_empresa', $usuario->id_empresa);
            if ($id_empresa) {
                $query->where('id_empresa', $id_empresa);
            }

            // Filtro por estado
            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            // Búsqueda
            if ($request->has('search') && $request->search) {
                $query->where('nombre_categoria', 'like', '%' . $request->search . '%');
            }

            // Ordenamiento
            $sortBy = $request->get('sortBy', 'created_at');
            $sortOrder = $request->get('sortOrder', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginación
            $perPage = $request->get('perPage', 10);
            $categorias = $query->paginate($perPage);

            return response()->json([
                'error' => false,
                'categorias' => $categorias->items(),
                'total' => $categorias->total(),
                'per_page' => $categorias->perPage(),
                'current_page' => $categorias->currentPage(),
                'last_page' => $categorias->lastPage()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener categorías: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear una nueva categoría
     */
    public function store(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $validator = Validator::make($request->all(), [
                'nombre_categoria' => 'required|string|max:100',
                'descripcion_categoria' => 'nullable|string',
                'estado' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 400);
            }

            // Obtener id_empresa del usuario o del request
            $id_empresa = $request->get('id_empresa', $usuario->id_empresa);

            // Validar que no exista otra categoría con el mismo nombre en la empresa
            $existe = Categoria::where('id_empresa', $id_empresa)
                               ->where('nombre_categoria', $request->nombre_categoria)
                               ->exists();

            if ($existe) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Ya existe una categoría con ese nombre en esta empresa'
                ], 400);
            }

            $categoria = Categoria::create([
                'id_empresa' => $id_empresa,
                'nombre_categoria' => $request->nombre_categoria,
                'descripcion_categoria' => $request->descripcion_categoria,
                'estado' => $request->get('estado', 1)
            ]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Categoría creada exitosamente',
                'categoria' => $categoria
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener una categoría específica
     */
    public function show($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $categoria = Categoria::find($id);

            if (!$categoria) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Categoría no encontrada'
                ], 404);
            }

            return response()->json([
                'error' => false,
                'categoria' => $categoria
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar una categoría
     */
    public function update(Request $request, $id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $categoria = Categoria::find($id);

            if (!$categoria) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Categoría no encontrada'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nombre_categoria' => 'required|string|max:100|unique:categorias,nombre_categoria,' . $id . ',id_categoria',
                'descripcion_categoria' => 'nullable|string',
                'estado' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 400);
            }

            $categoria->update([
                'nombre_categoria' => $request->nombre_categoria,
                'descripcion_categoria' => $request->descripcion_categoria,
                'estado' => $request->get('estado', $categoria->estado)
            ]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Categoría actualizada exitosamente',
                'categoria' => $categoria
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar una categoría (soft delete - cambiar estado)
     */
    public function destroy($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $categoria = Categoria::find($id);

            if (!$categoria) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Categoría no encontrada'
                ], 404);
            }

            // Soft delete - cambiar estado a 0
            $categoria->update(['estado' => 0]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Categoría eliminada exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al eliminar categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar una categoría eliminada
     */
    public function restore($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $categoria = Categoria::find($id);

            if (!$categoria) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Categoría no encontrada'
                ], 404);
            }

            $categoria->update(['estado' => 1]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Categoría restaurada exitosamente',
                'categoria' => $categoria
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al restaurar categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recibir categoría desde VB6
     * POST: email, token_api, y puede usar:
     *   - Id_Categoria + Categoria (formato VB6)
     *   - codigo + nombre_categoria (formato alternativo)
     * Si existe el codigo en esa empresa, actualiza. Si no, crea.
     */
    public function recibirDesdeVB6(Request $request)
    {
        try {
            // Normalizar nombres de campos para compatibilidad
            $data = $request->all();

            // Si viene Id_Categoria, mapearlo a codigo
            if (isset($data['Id_Categoria']) && !isset($data['codigo'])) {
                $data['codigo'] = $data['Id_Categoria'];
            }

            // Si viene Categoria, mapearlo a nombre_categoria
            if (isset($data['Categoria']) && !isset($data['nombre_categoria'])) {
                $data['nombre_categoria'] = $data['Categoria'];
            }

            $validator = Validator::make($data, [
                'email' => 'required|email',
                'token_api' => 'required|string',
                'codigo' => 'required',
                'nombre_categoria' => 'required|string|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Validar credenciales (email + token_api)
            $usuario = Usuario::where('email_us', $data['email'])->first();
            if (!$usuario) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Credenciales inválidas'
                ], 401);
            }

            $empresa = Empresa::where('token_api', $data['token_api'])->first();
            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Credenciales inválidas'
                ], 401);
            }

            // Verificar que el usuario tenga acceso a esta empresa
            $tieneAcceso = DB::table('usuarios_empresas')
                ->where('id_usuario', $usuario->id_usuario)
                ->where('id_empresa', $empresa->id_empresa)
                ->exists();

            if (!$tieneAcceso) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'El usuario no tiene acceso a esta empresa'
                ], 403);
            }

            // Buscar categoría por id_empresa y codigo (codvb6)
            $categoria = Categoria::where('id_empresa', $empresa->id_empresa)
                                  ->where('codvb6', $data['codigo'])
                                  ->first();

            if ($categoria) {
                // Actualizar categoría existente (corregir codificación UTF-8)
                $categoria->update([
                    'nombre_categoria' => EncodingHelper::fixEncoding($data['nombre_categoria']),
                    'estado' => isset($data['estado']) ? ($data['estado'] ? 1 : 0) : $categoria->estado
                ]);

                return response()->json([
                    'error' => false,
                    'mensaje' => 'Categoría actualizada desde VB6',
                    'accion' => 'actualizada',
                    'categoria' => $categoria
                ]);
            } else {
                // Crear nueva categoría (corregir codificación UTF-8)
                $categoria = Categoria::create([
                    'id_empresa' => $empresa->id_empresa,
                    'codvb6' => $data['codigo'],
                    'nombre_categoria' => EncodingHelper::fixEncoding($data['nombre_categoria']),
                    'estado' => isset($data['estado']) ? ($data['estado'] ? 1 : 0) : 1
                ]);

                return response()->json([
                    'error' => false,
                    'mensaje' => 'Categoría creada desde VB6',
                    'accion' => 'creada',
                    'categoria' => $categoria
                ], 201);
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al recibir categoría desde VB6: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recibir lote de categorías desde VB6 (batch)
     * POST: email, token_api, registros (array de categorías)
     * Procesa hasta 50 categorías en una sola petición
     */
    public function recibirLoteDesdeVB6(Request $request)
    {
        try {
            // Validar credenciales
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'token_api' => 'required|string',
                'registros' => 'required|array|min:1|max:50'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Validar credenciales (email + token_api)
            $usuario = Usuario::where('email_us', $request->email)->first();
            if (!$usuario) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Credenciales inválidas'
                ], 401);
            }

            $empresa = Empresa::where('token_api', $request->token_api)->first();
            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Credenciales inválidas'
                ], 401);
            }

            // Verificar que el usuario tenga acceso a esta empresa
            $tieneAcceso = DB::table('usuarios_empresas')
                ->where('id_usuario', $usuario->id_usuario)
                ->where('id_empresa', $empresa->id_empresa)
                ->exists();

            if (!$tieneAcceso) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'El usuario no tiene acceso a esta empresa'
                ], 403);
            }

            // Procesar cada categoría del lote
            $registros = $request->registros;
            $insertados = 0;
            $actualizados = 0;
            $errores = [];

            foreach ($registros as $index => $data) {
                try {
                    // Normalizar campos
                    if (isset($data['Id_Categoria']) && !isset($data['codigo'])) {
                        $data['codigo'] = $data['Id_Categoria'];
                    }
                    if (isset($data['Categoria']) && !isset($data['nombre_categoria'])) {
                        $data['nombre_categoria'] = $data['Categoria'];
                    }

                    // Validar campos requeridos
                    if (empty($data['codigo']) || empty($data['nombre_categoria'])) {
                        $errores[] = "Registro $index: Faltan campos requeridos (codigo, nombre_categoria)";
                        continue;
                    }

                    // Buscar categoría existente
                    $categoria = Categoria::where('id_empresa', $empresa->id_empresa)
                                          ->where('codvb6', $data['codigo'])
                                          ->first();

                    if ($categoria) {
                        // Corregir codificación UTF-8
                        $categoria->update([
                            'nombre_categoria' => EncodingHelper::fixEncoding($data['nombre_categoria']),
                            'estado' => isset($data['estado']) ? ($data['estado'] ? 1 : 0) : $categoria->estado
                        ]);
                        $actualizados++;
                    } else {
                        // Corregir codificación UTF-8
                        Categoria::create([
                            'id_empresa' => $empresa->id_empresa,
                            'codvb6' => $data['codigo'],
                            'nombre_categoria' => EncodingHelper::fixEncoding($data['nombre_categoria']),
                            'estado' => isset($data['estado']) ? ($data['estado'] ? 1 : 0) : 1
                        ]);
                        $insertados++;
                    }

                } catch (\Exception $e) {
                    $codigo = $data['codigo'] ?? $index;
                    $errores[] = "Registro $codigo: " . $e->getMessage();
                }
            }

            return response()->json([
                'error' => false,
                'mensaje' => 'Lote procesado correctamente',
                'insertados' => $insertados,
                'actualizados' => $actualizados,
                'total_procesados' => $insertados + $actualizados,
                'total_errores' => count($errores),
                'errores' => $errores
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al procesar lote de categorías: ' . $e->getMessage()
            ], 500);
        }
    }
}
