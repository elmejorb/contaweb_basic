<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class SyncController extends Controller
{
    /**
     * Sincronizar categorías
     */
    public function syncCategorias(Request $request)
    {
        return $this->syncGenerico($request, 'categorias', [
            'id_categoria' => 'id_local',
            'nombre_categoria' => 'datos.Categoria',
            'estado' => function($datos) {
                return 1; // Por defecto activo
            }
        ]);
    }

    /**
     * Sincronizar productos
     */
    public function syncProductos(Request $request)
    {
        return $this->syncGenerico($request, 'productos', [
            'id_producto' => 'id_local',
            'id_empresa' => function($datos) {
                return $this->obtenerEmpresaDefecto();
            },
            'id_categoria' => 'datos.Id_Categoria',
            'id_impuesto' => 'datos.Iva', // Mapear después
            'codigo_producto' => 'datos.Codigo',
            'nombre_producto' => 'datos.Nombres_Articulo',
            'descripcion_producto' => 'datos.Nombres_Articulo',
            'precio_compra' => 'datos.Precio_Costo',
            'precio_venta' => 'datos.Precio_Venta',
            'stock_actual' => 'datos.Existencia',
            'stock_minimo' => 'datos.Existencia_minima',
            'unidad_medida' => 'datos.unit_measure_id',
            'maneja_inventario' => function($datos) {
                return isset($datos['Servicio']) && $datos['Servicio'] == 0 ? 1 : 0;
            },
            'estado' => 'datos.Estado'
        ]);
    }

    /**
     * Sincronizar clientes
     */
    public function syncClientes(Request $request)
    {
        return $this->syncGenerico($request, 'clientes', [
            'id_cliente' => 'id_local',
            'id_empresa' => function($datos) {
                return $this->obtenerEmpresaDefecto();
            },
            'tipo_documento' => function($datos) {
                return 'CC'; // Por defecto, mapear después si tienes el campo
            },
            'numero_documento' => 'datos.Identificacion',
            'nombre_cliente' => function($datos) {
                $nombres = $datos['Nombres'] ?? '';
                $apellidos = $datos['Apellidos'] ?? '';
                return trim("$nombres $apellidos");
            },
            'telefono_cliente' => 'datos.Telefonos',
            'email_cliente' => 'datos.Email',
            'direccion_cliente' => 'datos.Direccion',
            'ciudad_cliente' => 'datos.id_municipio',
            'limite_credito' => 'datos.CupoAutorizado',
            'estado' => function($datos) {
                return 1; // Por defecto activo
            }
        ]);
    }

    /**
     * Sincronizar proveedores
     */
    public function syncProveedores(Request $request)
    {
        return $this->syncGenerico($request, 'proveedores', [
            'id_proveedor' => 'id_local',
            'id_empresa' => function($datos) {
                return $this->obtenerEmpresaDefecto();
            },
            'nombre_proveedor' => 'datos.Proveedor',
            'nit_proveedor' => 'datos.Nit',
            'telefono_proveedor' => 'datos.Telefono',
            'email_proveedor' => 'datos.Email',
            'direccion_proveedor' => 'datos.Direccion',
            'ciudad_proveedor' => 'datos.Ciudad',
            'estado' => function($datos) {
                return 1;
            }
        ]);
    }

    /**
     * Sincronizar ventas
     */
    public function syncVentas(Request $request)
    {
        return $this->syncGenerico($request, 'ventas', [
            'id_venta' => 'id_local',
            'id_empresa' => function($datos) {
                return $datos['CodigoEmp'] ?? $this->obtenerEmpresaDefecto();
            },
            'id_cliente' => 'datos.CodigoCli',
            'id_usuario' => 'datos.Id_Usuario',
            'id_estado' => function($datos) {
                // Mapear EstadoFact a id_estado
                $estado = $datos['EstadoFact'] ?? 'Pendiente';
                return $this->mapearEstadoFactura($estado);
            },
            'numero_factura' => 'datos.Factura_N',
            'fecha_venta' => function($datos) {
                return Carbon::parse($datos['Fecha'])->format('Y-m-d');
            },
            'subtotal' => function($datos) {
                $total = $datos['Total'] ?? 0;
                $impuesto = $datos['Impuesto'] ?? 0;
                return $total - $impuesto;
            },
            'total_impuestos' => 'datos.Impuesto',
            'descuento' => 'datos.Descuento',
            'total' => 'datos.Total',
            'forma_pago' => function($datos) {
                return $datos['Pago'] ?? 'efectivo';
            },
            'observaciones' => 'datos.Comentario',
            'sincronizado' => function($datos) {
                return 'S';
            }
        ]);
    }

    /**
     * Sincronizar detalles de venta
     */
    public function syncDetallesVenta(Request $request)
    {
        return $this->syncGenerico($request, 'detalles_venta', [
            'id_detalle' => 'id_local',
            'id_venta' => 'datos.Factura_N',
            'id_producto' => 'datos.Items',
            'cantidad' => 'datos.Cantidad',
            'precio_unitario' => 'datos.PrecioV',
            'subtotal' => 'datos.Subtotal',
            'impuesto' => function($datos) {
                $iva = $datos['IVA'] ?? 0;
                $cantidad = $datos['Cantidad'] ?? 1;
                $precio = $datos['PrecioV'] ?? 0;
                return ($precio * $cantidad * $iva / 100);
            },
            'total' => function($datos) {
                $subtotal = $datos['Subtotal'] ?? 0;
                $descuento = $datos['Descuento'] ?? 0;
                return $subtotal - $descuento;
            }
        ]);
    }

    /**
     * Sincronizar compras (pedidos)
     */
    public function syncCompras(Request $request)
    {
        return $this->syncGenerico($request, 'compras', [
            'id_compra' => 'id_local',
            'id_empresa' => function($datos) {
                return $datos['CodigoEmp'] ?? $this->obtenerEmpresaDefecto();
            },
            'id_proveedor' => 'datos.CodigoPro',
            'id_usuario' => 'datos.Id_Usuario',
            'numero_factura' => 'datos.Factura',
            'fecha_compra' => function($datos) {
                return Carbon::parse($datos['Fecha'])->format('Y-m-d');
            },
            'subtotal' => function($datos) {
                $total = $datos['Total'] ?? 0;
                $impuesto = $datos['Impuesto'] ?? 0;
                return $total - $impuesto;
            },
            'total_impuestos' => 'datos.Impuesto',
            'total' => 'datos.Total',
            'forma_pago' => function($datos) {
                return $datos['Pago'] ?? 'efectivo';
            },
            'observaciones' => 'datos.Comentario',
            'sincronizado' => function($datos) {
                return 'S';
            }
        ]);
    }

    /**
     * Sincronizar detalles de compra
     */
    public function syncDetallesCompra(Request $request)
    {
        return $this->syncGenerico($request, 'detalles_compra', [
            'id_detalle' => 'id_local',
            'id_compra' => 'datos.Pedido_N',
            'id_producto' => 'datos.Items',
            'cantidad' => 'datos.Cantidad',
            'precio_unitario' => 'datos.PrecioC',
            'subtotal' => 'datos.Subtotal',
            'impuesto' => 'datos.Impuesto',
            'total' => 'datos.Subtotal'
        ]);
    }

    /**
     * Sincronizar gastos
     */
    public function syncGastos(Request $request)
    {
        return $this->syncGenerico($request, 'gastos', [
            'id_gasto' => 'id_local',
            'id_empresa' => function($datos) {
                return $datos['CodigoEmp'] ?? $this->obtenerEmpresaDefecto();
            },
            'id_categoria_gasto' => function($datos) {
                return 1; // Categoría por defecto, mapear después
            },
            'id_usuario' => 'datos.Id_Usuario',
            'fecha_gasto' => function($datos) {
                return Carbon::parse($datos['Fecha'])->format('Y-m-d');
            },
            'concepto' => 'datos.Concepto',
            'valor' => 'datos.Valor',
            'forma_pago' => function($datos) {
                return 'efectivo';
            },
            'observaciones' => 'datos.Concepto',
            'sincronizado' => function($datos) {
                return 'S';
            }
        ]);
    }

    /**
     * Sincronizar arqueos de caja
     */
    public function syncArqueosCaja(Request $request)
    {
        return $this->syncGenerico($request, 'arqueos_caja', [
            'id_arqueo' => 'id_local',
            'id_empresa' => function($datos) {
                return $datos['CodigoEmp'] ?? $this->obtenerEmpresaDefecto();
            },
            'id_usuario' => 'datos.Id_Usuario',
            'fecha_arqueo' => function($datos) {
                return Carbon::parse($datos['Fecha'])->format('Y-m-d');
            },
            'saldo_inicial' => 'datos.ValorInicalCaja',
            'total_ingresos' => function($datos) {
                return ($datos['VContado'] ?? 0) + ($datos['VCredito'] ?? 0);
            },
            'total_egresos' => 'datos.Egresos',
            'saldo_final' => 'datos.ValorTotal',
            'saldo_real' => 'datos.ValorTotal',
            'diferencia' => 'datos.Diferencia',
            'observaciones' => null,
            'cerrado' => 'datos.Estado'
        ]);
    }

    /**
     * Sincronizar cartera de clientes (pagos)
     */
    public function syncCarteraClientes(Request $request)
    {
        return $this->syncGenerico($request, 'cartera_clientes', [
            'id_cartera' => 'id_local',
            'id_cliente' => 'datos.CodigoClien',
            'id_venta' => 'datos.Id_Factura',
            'tipo_movimiento' => function($datos) {
                return 'abono';
            },
            'valor' => 'datos.Valor',
            'fecha_movimiento' => function($datos) {
                return Carbon::parse($datos['Fecha'])->format('Y-m-d');
            },
            'observaciones' => 'datos.Observaciones'
        ]);
    }

    /**
     * Método genérico de sincronización
     */
    private function syncGenerico(Request $request, $tabla, $mapeo)
    {
        try {
            // Validar request
            $validator = Validator::make($request->all(), [
                'tabla_local' => 'required|string',
                'tabla_remota' => 'required|string',
                'operacion' => 'required|in:INSERT,UPDATE,DELETE',
                'id_local' => 'required',
                'datos' => 'required|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 400);
            }

            $operacion = $request->operacion;
            $idLocal = $request->id_local;
            $datos = $request->datos;

            // Transformar datos según mapeo
            $datosTransformados = $this->transformarDatos($datos, $mapeo, $idLocal);

            // Ejecutar operación
            switch ($operacion) {
                case 'INSERT':
                    DB::table($tabla)->insert($datosTransformados);
                    break;

                case 'UPDATE':
                    // Buscar por id_local mapeado
                    $campoId = $this->obtenerCampoId($tabla);
                    DB::table($tabla)
                        ->where($campoId, $idLocal)
                        ->update($datosTransformados);
                    break;

                case 'DELETE':
                    $campoId = $this->obtenerCampoId($tabla);
                    DB::table($tabla)
                        ->where($campoId, $idLocal)
                        ->delete();
                    break;
            }

            return response()->json([
                'error' => false,
                'mensaje' => "Registro sincronizado exitosamente",
                'operacion' => $operacion,
                'tabla' => $tabla,
                'id_local' => $idLocal
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al sincronizar: ' . $e->getMessage(),
                'linea' => $e->getLine()
            ], 500);
        }
    }

    /**
     * Transformar datos según mapeo
     */
    private function transformarDatos($datos, $mapeo, $idLocal)
    {
        $resultado = [];

        foreach ($mapeo as $campoDestino => $origen) {
            // Si es una función
            if (is_callable($origen)) {
                $resultado[$campoDestino] = $origen($datos);
            }
            // Si es un string con punto (path)
            elseif (is_string($origen) && strpos($origen, '.') !== false) {
                $partes = explode('.', $origen);
                $valor = $datos;
                foreach ($partes as $parte) {
                    $valor = $valor[$parte] ?? null;
                }
                $resultado[$campoDestino] = $valor;
            }
            // Si es 'id_local'
            elseif ($origen === 'id_local') {
                $resultado[$campoDestino] = $idLocal;
            }
            // Acceso directo
            else {
                $resultado[$campoDestino] = $datos[$origen] ?? null;
            }
        }

        // Agregar timestamps
        $resultado['updated_at'] = Carbon::now();
        if (!isset($resultado['created_at'])) {
            $resultado['created_at'] = Carbon::now();
        }

        return $resultado;
    }

    /**
     * Obtener campo ID de una tabla
     */
    private function obtenerCampoId($tabla)
    {
        $camposId = [
            'categorias' => 'id_categoria',
            'productos' => 'id_producto',
            'clientes' => 'id_cliente',
            'proveedores' => 'id_proveedor',
            'ventas' => 'id_venta',
            'detalles_venta' => 'id_detalle',
            'compras' => 'id_compra',
            'detalles_compra' => 'id_detalle',
            'gastos' => 'id_gasto',
            'arqueos_caja' => 'id_arqueo',
            'cartera_clientes' => 'id_cartera'
        ];

        return $camposId[$tabla] ?? 'id';
    }

    /**
     * Obtener empresa por defecto
     */
    private function obtenerEmpresaDefecto()
    {
        // Retornar el ID de la primera empresa o crear una por defecto
        $empresa = DB::table('empresas')->first();
        return $empresa ? $empresa->id_empresa : 1;
    }

    /**
     * Mapear estado de factura
     */
    private function mapearEstadoFactura($estadoLocal)
    {
        $mapeo = [
            'Pendiente' => 1,
            'Pagada' => 2,
            'Anulada' => 3
        ];

        return $mapeo[$estadoLocal] ?? 1;
    }
}
