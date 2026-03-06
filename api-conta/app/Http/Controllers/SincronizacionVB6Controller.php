<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use App\Models\Producto;
use App\Models\Cliente;
use App\Models\Proveedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SincronizacionVB6Controller extends Controller
{
    /**
     * Sincronizar Categoría desde VB6
     * Si existe el codvb6, actualiza. Si no existe, crea.
     */
    public function sincronizarCategoria(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_empresa' => 'required|integer',
                'codvb6' => 'required|string|max:50',
                'nombre_categoria' => 'required|string|max:100',
                'descripcion_categoria' => 'nullable|string|max:255',
                'estado' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Errores de validación',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Buscar por id_empresa y codvb6
            $categoria = Categoria::where('id_empresa', $request->id_empresa)
                                  ->where('codvb6', $request->codvb6)
                                  ->first();

            if ($categoria) {
                // Actualizar
                $categoria->update($request->all());
                $mensaje = 'Categoría actualizada desde VB6';
            } else {
                // Crear
                $categoria = Categoria::create($request->all());
                $mensaje = 'Categoría creada desde VB6';
            }

            return response()->json([
                'error' => false,
                'mensaje' => $mensaje,
                'categoria' => $categoria
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al sincronizar categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sincronizar Producto desde VB6
     */
    public function sincronizarProducto(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_empresa' => 'required|integer',
                'codvb6' => 'required|string|max:50',
                'codigo_producto' => 'required|string|max:50',
                'nombre_producto' => 'required|string|max:200',
                'precio_compra' => 'nullable|numeric',
                'precio_venta' => 'required|numeric',
                'stock_actual' => 'nullable|integer',
                'estado' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Errores de validación',
                    'errores' => $validator->errors()
                ], 422);
            }

            $producto = Producto::where('id_empresa', $request->id_empresa)
                               ->where('codvb6', $request->codvb6)
                               ->first();

            if ($producto) {
                $producto->update($request->all());
                $mensaje = 'Producto actualizado desde VB6';
            } else {
                $producto = Producto::create($request->all());
                $mensaje = 'Producto creado desde VB6';
            }

            return response()->json([
                'error' => false,
                'mensaje' => $mensaje,
                'producto' => $producto
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al sincronizar producto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sincronizar Cliente desde VB6
     */
    public function sincronizarCliente(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_empresa' => 'required|integer',
                'codvb6' => 'required|string|max:50',
                'nombre_razon_social' => 'required|string|max:200',
                'tipo_documento' => 'nullable|string|max:50',
                'numero_documento' => 'nullable|string|max:50',
                'telefono' => 'nullable|string|max:50',
                'email' => 'nullable|email|max:100',
                'direccion' => 'nullable|string',
                'estado' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Errores de validación',
                    'errores' => $validator->errors()
                ], 422);
            }

            $cliente = Cliente::where('id_empresa', $request->id_empresa)
                             ->where('codvb6', $request->codvb6)
                             ->first();

            if ($cliente) {
                $cliente->update($request->all());
                $mensaje = 'Cliente actualizado desde VB6';
            } else {
                $cliente = Cliente::create($request->all());
                $mensaje = 'Cliente creado desde VB6';
            }

            return response()->json([
                'error' => false,
                'mensaje' => $mensaje,
                'cliente' => $cliente
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al sincronizar cliente: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sincronizar Proveedor desde VB6
     */
    public function sincronizarProveedor(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_empresa' => 'required|integer',
                'codvb6' => 'required|string|max:50',
                'razon_social' => 'required|string|max:200',
                'nit' => 'nullable|string|max:50',
                'telefono' => 'nullable|string|max:50',
                'email' => 'nullable|email|max:100',
                'direccion' => 'nullable|string',
                'estado' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Errores de validación',
                    'errores' => $validator->errors()
                ], 422);
            }

            $proveedor = Proveedor::where('id_empresa', $request->id_empresa)
                                 ->where('codvb6', $request->codvb6)
                                 ->first();

            if ($proveedor) {
                $proveedor->update($request->all());
                $mensaje = 'Proveedor actualizado desde VB6';
            } else {
                $proveedor = Proveedor::create($request->all());
                $mensaje = 'Proveedor creado desde VB6';
            }

            return response()->json([
                'error' => false,
                'mensaje' => $mensaje,
                'proveedor' => $proveedor
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al sincronizar proveedor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sincronización masiva (batch)
     * Permite enviar múltiples registros de cada tipo en una sola petición
     */
    public function sincronizarLote(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_empresa' => 'required|integer',
                'categorias' => 'nullable|array',
                'productos' => 'nullable|array',
                'clientes' => 'nullable|array',
                'proveedores' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Errores de validación',
                    'errores' => $validator->errors()
                ], 422);
            }

            $resultados = [
                'categorias' => ['creadas' => 0, 'actualizadas' => 0, 'errores' => 0],
                'productos' => ['creadas' => 0, 'actualizadas' => 0, 'errores' => 0],
                'clientes' => ['creados' => 0, 'actualizados' => 0, 'errores' => 0],
                'proveedores' => ['creados' => 0, 'actualizados' => 0, 'errores' => 0]
            ];

            DB::beginTransaction();

            try {
                // Sincronizar categorías
                if ($request->has('categorias')) {
                    foreach ($request->categorias as $categoriaData) {
                        try {
                            $categoriaData['id_empresa'] = $request->id_empresa;
                            $categoria = Categoria::where('id_empresa', $request->id_empresa)
                                                 ->where('codvb6', $categoriaData['codvb6'])
                                                 ->first();

                            if ($categoria) {
                                $categoria->update($categoriaData);
                                $resultados['categorias']['actualizadas']++;
                            } else {
                                Categoria::create($categoriaData);
                                $resultados['categorias']['creadas']++;
                            }
                        } catch (\Exception $e) {
                            $resultados['categorias']['errores']++;
                        }
                    }
                }

                // Sincronizar productos
                if ($request->has('productos')) {
                    foreach ($request->productos as $productoData) {
                        try {
                            $productoData['id_empresa'] = $request->id_empresa;
                            $producto = Producto::where('id_empresa', $request->id_empresa)
                                               ->where('codvb6', $productoData['codvb6'])
                                               ->first();

                            if ($producto) {
                                $producto->update($productoData);
                                $resultados['productos']['actualizadas']++;
                            } else {
                                Producto::create($productoData);
                                $resultados['productos']['creadas']++;
                            }
                        } catch (\Exception $e) {
                            $resultados['productos']['errores']++;
                        }
                    }
                }

                // Sincronizar clientes
                if ($request->has('clientes')) {
                    foreach ($request->clientes as $clienteData) {
                        try {
                            $clienteData['id_empresa'] = $request->id_empresa;
                            $cliente = Cliente::where('id_empresa', $request->id_empresa)
                                             ->where('codvb6', $clienteData['codvb6'])
                                             ->first();

                            if ($cliente) {
                                $cliente->update($clienteData);
                                $resultados['clientes']['actualizados']++;
                            } else {
                                Cliente::create($clienteData);
                                $resultados['clientes']['creados']++;
                            }
                        } catch (\Exception $e) {
                            $resultados['clientes']['errores']++;
                        }
                    }
                }

                // Sincronizar proveedores
                if ($request->has('proveedores')) {
                    foreach ($request->proveedores as $proveedorData) {
                        try {
                            $proveedorData['id_empresa'] = $request->id_empresa;
                            $proveedor = Proveedor::where('id_empresa', $request->id_empresa)
                                                 ->where('codvb6', $proveedorData['codvb6'])
                                                 ->first();

                            if ($proveedor) {
                                $proveedor->update($proveedorData);
                                $resultados['proveedores']['actualizados']++;
                            } else {
                                Proveedor::create($proveedorData);
                                $resultados['proveedores']['creados']++;
                            }
                        } catch (\Exception $e) {
                            $resultados['proveedores']['errores']++;
                        }
                    }
                }

                DB::commit();

                return response()->json([
                    'error' => false,
                    'mensaje' => 'Sincronización masiva completada',
                    'resultados' => $resultados
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error en sincronización masiva: ' . $e->getMessage()
            ], 500);
        }
    }
}
