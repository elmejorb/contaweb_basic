<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\Empresa;
use App\Models\Usuario;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Helpers\EncodingHelper;

class ProductoController extends Controller
{
    /**
     * Listar todos los productos
     */
    public function index(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $query = Producto::with(['categoria', 'impuesto']);

            // Filtro por empresa del usuario
            if ($request->has('id_empresa')) {
                $query->where('id_empresa', $request->id_empresa);
            }

            // Filtro por estado
            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            // Filtro por categoría
            if ($request->has('id_categoria')) {
                $query->where('id_categoria', $request->id_categoria);
            }

            // Búsqueda por código o nombre
            if ($request->has('search') && $request->search) {
                $query->buscar($request->search);
            }

            // Filtro por stock bajo
            if ($request->has('stock_bajo') && $request->stock_bajo) {
                $query->stockBajo();
            }

            // Ordenamiento
            $sortBy = $request->get('sortBy', 'created_at');
            $sortOrder = $request->get('sortOrder', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginación
            $perPage = $request->get('perPage', 10);
            $productos = $query->paginate($perPage);

            return response()->json([
                'error' => false,
                'productos' => $productos->items(),
                'total' => $productos->total(),
                'per_page' => $productos->perPage(),
                'current_page' => $productos->currentPage(),
                'last_page' => $productos->lastPage()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener productos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo producto
     */
    public function store(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $validator = Validator::make($request->all(), [
                'id_empresa' => 'required|exists:empresas,id_empresa',
                'id_categoria' => 'nullable|exists:categorias,id_categoria',
                'id_impuesto' => 'nullable|exists:impuestos,id_impuesto',
                'codigo_producto' => 'required|string|max:50',
                'nombre_producto' => 'required|string|max:200',
                'descripcion_producto' => 'nullable|string',
                'precio_compra' => 'numeric|min:0',
                'precio_venta' => 'required|numeric|min:0',
                'precio_venta_2' => 'nullable|numeric|min:0',
                'precio_venta_3' => 'nullable|numeric|min:0',
                'precio_venta_4' => 'nullable|numeric|min:0',
                'precio_minimo' => 'nullable|numeric|min:0',
                'stock_actual' => 'integer|min:0',
                'stock_minimo' => 'integer|min:0',
                'unidad_medida' => 'nullable|string|max:20',
                'ubicacion' => 'nullable|string|max:100',
                'imagen_producto' => 'nullable|string',
                'maneja_inventario' => 'boolean',
                'estado' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 400);
            }

            // Verificar que el código no exista para la empresa
            $existe = Producto::where('codigo_producto', $request->codigo_producto)
                              ->where('id_empresa', $request->id_empresa)
                              ->exists();

            if ($existe) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'El código de producto ya existe para esta empresa'
                ], 400);
            }

            $producto = Producto::create([
                'id_empresa' => $request->id_empresa,
                'id_categoria' => $request->id_categoria,
                'id_impuesto' => $request->id_impuesto,
                'codigo_producto' => $request->codigo_producto,
                'nombre_producto' => $request->nombre_producto,
                'descripcion_producto' => $request->descripcion_producto,
                'precio_compra' => $request->get('precio_compra', 0),
                'precio_venta' => $request->precio_venta,
                'precio_venta_2' => $request->get('precio_venta_2', 0),
                'precio_venta_3' => $request->get('precio_venta_3', 0),
                'precio_venta_4' => $request->get('precio_venta_4', 0),
                'precio_minimo' => $request->get('precio_minimo', 0),
                'stock_actual' => $request->get('stock_actual', 0),
                'stock_minimo' => $request->get('stock_minimo', 0),
                'unidad_medida' => $request->unidad_medida,
                'ubicacion' => $request->ubicacion,
                'imagen_producto' => $request->imagen_producto,
                'maneja_inventario' => $request->get('maneja_inventario', 1),
                'estado' => $request->get('estado', 1)
            ]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Producto creado exitosamente',
                'producto' => $producto->load(['categoria', 'impuesto'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear producto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener un producto específico
     */
    public function show($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $producto = Producto::with(['categoria', 'impuesto', 'empresa'])->find($id);

            if (!$producto) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Producto no encontrado'
                ], 404);
            }

            return response()->json([
                'error' => false,
                'producto' => $producto
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener producto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un producto
     */
    public function update(Request $request, $id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $producto = Producto::find($id);

            if (!$producto) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Producto no encontrado'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'id_categoria' => 'nullable|exists:categorias,id_categoria',
                'id_impuesto' => 'nullable|exists:impuestos,id_impuesto',
                'codigo_producto' => 'required|string|max:50',
                'nombre_producto' => 'required|string|max:200',
                'descripcion_producto' => 'nullable|string',
                'precio_compra' => 'numeric|min:0',
                'precio_venta' => 'required|numeric|min:0',
                'precio_venta_2' => 'nullable|numeric|min:0',
                'precio_venta_3' => 'nullable|numeric|min:0',
                'precio_venta_4' => 'nullable|numeric|min:0',
                'precio_minimo' => 'nullable|numeric|min:0',
                'stock_actual' => 'integer|min:0',
                'stock_minimo' => 'integer|min:0',
                'unidad_medida' => 'nullable|string|max:20',
                'ubicacion' => 'nullable|string|max:100',
                'imagen_producto' => 'nullable|string',
                'maneja_inventario' => 'boolean',
                'estado' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 400);
            }

            // Verificar que el código no exista para otro producto de la misma empresa
            $existe = Producto::where('codigo_producto', $request->codigo_producto)
                              ->where('id_empresa', $producto->id_empresa)
                              ->where('id_producto', '!=', $id)
                              ->exists();

            if ($existe) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'El código de producto ya existe para otro producto'
                ], 400);
            }

            $producto->update([
                'id_categoria' => $request->id_categoria,
                'id_impuesto' => $request->id_impuesto,
                'codigo_producto' => $request->codigo_producto,
                'nombre_producto' => $request->nombre_producto,
                'descripcion_producto' => $request->descripcion_producto,
                'precio_compra' => $request->get('precio_compra', $producto->precio_compra),
                'precio_venta' => $request->precio_venta,
                'precio_venta_2' => $request->get('precio_venta_2', $producto->precio_venta_2),
                'precio_venta_3' => $request->get('precio_venta_3', $producto->precio_venta_3),
                'precio_venta_4' => $request->get('precio_venta_4', $producto->precio_venta_4),
                'precio_minimo' => $request->get('precio_minimo', $producto->precio_minimo),
                'stock_actual' => $request->get('stock_actual', $producto->stock_actual),
                'stock_minimo' => $request->get('stock_minimo', $producto->stock_minimo),
                'unidad_medida' => $request->unidad_medida,
                'ubicacion' => $request->ubicacion,
                'imagen_producto' => $request->imagen_producto,
                'maneja_inventario' => $request->get('maneja_inventario', $producto->maneja_inventario),
                'estado' => $request->get('estado', $producto->estado)
            ]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Producto actualizado exitosamente',
                'producto' => $producto->load(['categoria', 'impuesto'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar producto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un producto (soft delete - cambiar estado)
     */
    public function destroy($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $producto = Producto::find($id);

            if (!$producto) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Producto no encontrado'
                ], 404);
            }

            // Soft delete - cambiar estado a 0
            $producto->update(['estado' => 0]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Producto eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al eliminar producto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar un producto eliminado
     */
    public function restore($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $producto = Producto::find($id);

            if (!$producto) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Producto no encontrado'
                ], 404);
            }

            $producto->update(['estado' => 1]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Producto restaurado exitosamente',
                'producto' => $producto->load(['categoria', 'impuesto'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al restaurar producto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar producto por código
     */
    public function buscarPorCodigo(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $validator = Validator::make($request->all(), [
                'codigo' => 'required|string',
                'id_empresa' => 'required|exists:empresas,id_empresa'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 400);
            }

            $producto = Producto::with(['categoria', 'impuesto'])
                                ->where('codigo_producto', $request->codigo)
                                ->where('id_empresa', $request->id_empresa)
                                ->where('estado', 1)
                                ->first();

            if (!$producto) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Producto no encontrado'
                ], 404);
            }

            return response()->json([
                'error' => false,
                'producto' => $producto
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al buscar producto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recibir producto desde VB6
     * POST: email, token_api, codigo, nombre_pro, etc.
     * Acepta múltiples formatos de campo para compatibilidad
     * Si existe el codigo en esa empresa, actualiza. Si no, crea.
     */
    public function recibirDesdeVB6(Request $request)
    {
        try {
            // Normalizar nombres de campos para compatibilidad
            $data = $request->all();

            // Mapear campos alternativos al formato estándar
            if (isset($data['Codigo']) && !isset($data['codigo'])) {
                $data['codigo'] = $data['Codigo'];
            }
            if (isset($data['Nombres_Articulo']) && !isset($data['nombre_pro'])) {
                $data['nombre_pro'] = $data['Nombres_Articulo'];
            }
            if (!isset($data['codigo']) && !isset($data['nombre_pro'])) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Faltan campos requeridos: codigo y nombre_pro'
                ], 422);
            }

            $validator = Validator::make($data, [
                'email' => 'required|email',
                'token_api' => 'required|string',
                'codigo' => 'required',
                'nombre_pro' => 'required|string|max:200'
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

            // Buscar categoría por codvb6 si viene cod_categoria o Id_Categoria
            $id_categoria = null;
            $codCategoria = $data['cod_categoria'] ?? $data['Id_Categoria'] ?? null;
            if ($codCategoria) {
                $categoria = Categoria::where('id_empresa', $empresa->id_empresa)
                                      ->where('codvb6', $codCategoria)
                                      ->first();
                if ($categoria) {
                    $id_categoria = $categoria->id_categoria;
                }
            }

            // Buscar producto por id_empresa y codigo (codvb6)
            $producto = Producto::where('id_empresa', $empresa->id_empresa)
                                ->where('codvb6', $data['codigo'])
                                ->first();

            // Mapear campos con soporte para múltiples formatos
            // Corregir codificación UTF-8 para campos de texto
            $datosProducto = [
                'nombre_producto' => EncodingHelper::fixEncoding($data['nombre_pro'] ?? $data['Nombres_Articulo'] ?? ''),
                'stock_actual' => $data['existencia'] ?? $data['Existencia'] ?? 0,
                'stock_minimo' => $data['existencia_min'] ?? $data['Existencia_minima'] ?? 0,
                'precio_compra' => $data['precio_costo'] ?? $data['Precio_Costo'] ?? 0,
                'precio_venta' => $data['precio_venta1'] ?? $data['Precio_Venta'] ?? 0,
                'precio_venta_2' => $data['precio_venta2'] ?? $data['Precio_Venta2'] ?? 0,
                'precio_venta_3' => $data['precio_venta3'] ?? $data['Precio_Venta3'] ?? 0,
                'precio_venta_4' => $data['precio_venta4'] ?? $data['Precio_Venta4'] ?? 0,
                'precio_minimo' => $data['precio_venta_min'] ?? $data['Precio_Minimo'] ?? 0,
                'es_servicio' => $data['servicio_pro'] ?? $data['Servicio'] ?? 0,
                'id_categoria' => $id_categoria,
                'codigo_producto' => $data['codigo'],
                'estado' => $data['estado'] ?? $data['Estado'] ?? 1
            ];

            if ($producto) {
                // Actualizar producto existente
                $producto->update($datosProducto);

                return response()->json([
                    'error' => false,
                    'mensaje' => 'Producto actualizado desde VB6',
                    'accion' => 'actualizada',
                    'producto' => $producto
                ]);
            } else {
                // Crear nuevo producto
                $datosProducto['id_empresa'] = $empresa->id_empresa;
                $datosProducto['codvb6'] = $data['codigo'];

                $producto = Producto::create($datosProducto);

                return response()->json([
                    'error' => false,
                    'mensaje' => 'Producto creado desde VB6',
                    'accion' => 'creada',
                    'producto' => $producto
                ], 201);
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al recibir producto desde VB6: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recibir lote de productos desde VB6 (batch)
     * POST: email, token_api, registros (array de productos)
     * Procesa hasta 20 productos en una sola petición
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

            // Procesar cada producto del lote
            $registros = $request->registros;
            $insertados = 0;
            $actualizados = 0;
            $errores = [];

            foreach ($registros as $index => $data) {
                try {
                    // Sanitizar todos los strings de entrada para asegurar UTF-8 válido
                    $data = array_map(function($value) {
                        if (is_string($value)) {
                            // Limpiar caracteres UTF-8 inválidos
                            $clean = @iconv('UTF-8', 'UTF-8//IGNORE', $value);
                            return $clean !== false ? $clean : $value;
                        }
                        return $value;
                    }, $data);

                    // Normalizar campos
                    if (isset($data['Codigo']) && !isset($data['codigo'])) {
                        $data['codigo'] = $data['Codigo'];
                    }
                    if (isset($data['Nombres_Articulo']) && !isset($data['nombre_pro'])) {
                        $data['nombre_pro'] = $data['Nombres_Articulo'];
                    }

                    // Validar campos requeridos
                    if (empty($data['codigo']) || empty($data['nombre_pro'])) {
                        $errores[] = "Registro $index: Faltan campos requeridos (codigo, nombre_pro)";
                        continue;
                    }

                    // Buscar categoría por codvb6
                    $id_categoria = null;
                    $codCategoria = $data['cod_categoria'] ?? $data['Id_Categoria'] ?? null;
                    if ($codCategoria) {
                        $categoria = Categoria::where('id_empresa', $empresa->id_empresa)
                                              ->where('codvb6', $codCategoria)
                                              ->first();
                        if ($categoria) {
                            $id_categoria = $categoria->id_categoria;
                        }
                    }

                    // Preparar datos del producto (corregir codificación UTF-8)
                    $datosProducto = [
                        'nombre_producto' => EncodingHelper::fixEncoding($data['nombre_pro'] ?? $data['Nombres_Articulo'] ?? ''),
                        'stock_actual' => $data['existencia'] ?? $data['Existencia'] ?? 0,
                        'stock_minimo' => $data['existencia_min'] ?? $data['Existencia_minima'] ?? 0,
                        'precio_compra' => $data['precio_costo'] ?? $data['Precio_Costo'] ?? 0,
                        'precio_venta' => $data['precio_venta1'] ?? $data['Precio_Venta'] ?? 0,
                        'precio_venta_2' => $data['precio_venta2'] ?? $data['Precio_Venta2'] ?? 0,
                        'precio_venta_3' => $data['precio_venta3'] ?? $data['Precio_Venta3'] ?? 0,
                        'precio_venta_4' => $data['precio_venta4'] ?? $data['Precio_Venta4'] ?? 0,
                        'precio_minimo' => $data['precio_venta_min'] ?? $data['Precio_Minimo'] ?? 0,
                        'es_servicio' => $data['servicio_pro'] ?? $data['Servicio'] ?? 0,
                        'id_categoria' => $id_categoria,
                        'codigo_producto' => $data['codigo'],
                        'estado' => $data['estado'] ?? $data['Estado'] ?? 1
                    ];

                    // Buscar producto existente
                    $producto = Producto::where('id_empresa', $empresa->id_empresa)
                                        ->where('codvb6', $data['codigo'])
                                        ->first();

                    if ($producto) {
                        $producto->update($datosProducto);
                        $actualizados++;
                    } else {
                        $datosProducto['id_empresa'] = $empresa->id_empresa;
                        $datosProducto['codvb6'] = $data['codigo'];
                        Producto::create($datosProducto);
                        $insertados++;
                    }

                } catch (\Exception $e) {
                    $codigo = $data['codigo'] ?? $index;
                    $errores[] = "Registro $codigo: " . $e->getMessage();
                }
            }

            // Sanitizar mensajes de error para JSON
            $erroresSanitizados = array_map(function($error) {
                return mb_convert_encoding($error, 'UTF-8', 'UTF-8');
            }, $errores);

            return response()->json([
                'error' => false,
                'mensaje' => 'Lote procesado correctamente',
                'insertados' => $insertados,
                'actualizados' => $actualizados,
                'total_procesados' => $insertados + $actualizados,
                'total_errores' => count($erroresSanitizados),
                'errores' => $erroresSanitizados
            ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);

        } catch (\Exception $e) {
            $mensaje = mb_convert_encoding($e->getMessage(), 'UTF-8', 'UTF-8');
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al procesar lote de productos: ' . $mensaje
            ], 500, [], JSON_INVALID_UTF8_SUBSTITUTE);
        }
    }

    /**
     * Obtener estadísticas de productos
     */
    public function estadisticas(Request $request)
    {
        try {
            $id_empresa = $request->input('id_empresa');

            if (!$id_empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Debe proporcionar id_empresa'
                ], 400);
            }

            // Total de productos activos
            $totalProductos = Producto::where('id_empresa', $id_empresa)
                                      ->where('estado', 1)
                                      ->count();

            // Total del inventario (precio_compra * stock_actual)
            $totalInventario = Producto::where('id_empresa', $id_empresa)
                                       ->where('estado', 1)
                                       ->selectRaw('SUM(precio_compra * stock_actual) as total')
                                       ->value('total') ?? 0;

            // Productos agotados (stock = 0)
            $productosAgotados = Producto::where('id_empresa', $id_empresa)
                                         ->where('estado', 1)
                                         ->where('stock_actual', 0)
                                         ->count();

            // Productos con stock bajo (stock > 0 y stock <= stock_minimo)
            $productosStockBajo = Producto::where('id_empresa', $id_empresa)
                                          ->where('estado', 1)
                                          ->where('stock_actual', '>', 0)
                                          ->whereColumn('stock_actual', '<=', 'stock_minimo')
                                          ->count();

            // Promedio de utilidad (margen de ganancia)
            // Utilidad = ((precio_venta - precio_compra) / precio_compra) * 100
            $promedioUtilidad = Producto::where('id_empresa', $id_empresa)
                                        ->where('estado', 1)
                                        ->where('precio_compra', '>', 0)
                                        ->selectRaw('AVG(((precio_venta - precio_compra) / precio_compra) * 100) as promedio')
                                        ->value('promedio') ?? 0;

            return response()->json([
                'error' => false,
                'estadisticas' => [
                    'total_productos' => $totalProductos,
                    'total_inventario' => round($totalInventario, 2),
                    'productos_agotados' => $productosAgotados,
                    'productos_stock_bajo' => $productosStockBajo,
                    'promedio_utilidad' => round($promedioUtilidad, 2)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }
}
