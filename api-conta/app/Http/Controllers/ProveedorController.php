<?php

namespace App\Http\Controllers;

use App\Models\Proveedor;
use App\Models\Empresa;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Helpers\EncodingHelper;

class ProveedorController extends Controller
{
    /**
     * Listar proveedores con paginación, búsqueda y filtros
     */
    public function listar(Request $request)
    {
        try {
            $id_empresa = $request->input('id_empresa');
            $page = $request->input('page', 1);
            $perPage = $request->input('perPage', 10);
            $search = $request->input('search');
            $estado = $request->input('estado');

            $query = Proveedor::where('id_empresa', $id_empresa);

            // Filtro por estado
            if ($estado !== null) {
                $query->where('estado', $estado);
            }

            // Búsqueda por razón social, NIT o código
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('razon_social', 'LIKE', "%{$search}%")
                      ->orWhere('nit', 'LIKE', "%{$search}%")
                      ->orWhere('codigo_proveedor', 'LIKE', "%{$search}%");
                });
            }

            $total = $query->count();
            $proveedores = $query->orderBy('razon_social', 'asc')
                                ->skip(($page - 1) * $perPage)
                                ->take($perPage)
                                ->get();

            return response()->json([
                'error' => false,
                'proveedores' => $proveedores,
                'total' => $total,
                'page' => $page,
                'perPage' => $perPage
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al listar proveedores: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener un proveedor por ID
     */
    public function obtener($id)
    {
        try {
            $proveedor = Proveedor::find($id);

            if (!$proveedor) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Proveedor no encontrado'
                ], 404);
            }

            return response()->json([
                'error' => false,
                'proveedor' => $proveedor
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener proveedor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo proveedor
     */
    public function crear(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_empresa' => 'required|integer',
                'razon_social' => 'required|string|max:200',
                'nit' => 'required|string|max:50',
                'telefono' => 'nullable|string|max:50',
                'email' => 'nullable|email|max:100',
                'direccion' => 'nullable|string',
                'contacto_nombres' => 'nullable|string|max:100',
                'contacto_apellidos' => 'nullable|string|max:100',
                'contacto_identificacion' => 'nullable|string|max:50',
                'contacto_telefono' => 'nullable|string|max:50',
                'contacto_direccion' => 'nullable|string|max:255',
                'numero_cuentas_banco' => 'nullable|string',
                'estado' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Errores de validación',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Verificar si ya existe un proveedor con ese NIT en la empresa
            $existente = Proveedor::where('id_empresa', $request->id_empresa)
                                  ->where('nit', $request->nit)
                                  ->first();

            if ($existente) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Ya existe un proveedor con ese NIT en esta empresa'
                ], 422);
            }

            // Generar código de proveedor si no se proporciona
            if (!$request->has('codigo_proveedor') || empty($request->codigo_proveedor)) {
                $ultimoProveedor = Proveedor::where('id_empresa', $request->id_empresa)
                                           ->orderBy('id_proveedor', 'desc')
                                           ->first();

                $numeroConsecutivo = $ultimoProveedor ? ($ultimoProveedor->id_proveedor + 1) : 1;
                $request->merge(['codigo_proveedor' => 'PROV-' . str_pad($numeroConsecutivo, 6, '0', STR_PAD_LEFT)]);
            }

            $proveedor = Proveedor::create($request->all());

            return response()->json([
                'error' => false,
                'mensaje' => 'Proveedor creado exitosamente',
                'proveedor' => $proveedor
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear proveedor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un proveedor existente
     */
    public function actualizar(Request $request, $id)
    {
        try {
            $proveedor = Proveedor::find($id);

            if (!$proveedor) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Proveedor no encontrado'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'razon_social' => 'required|string|max:200',
                'nit' => 'required|string|max:50',
                'telefono' => 'nullable|string|max:50',
                'email' => 'nullable|email|max:100',
                'direccion' => 'nullable|string',
                'contacto_nombres' => 'nullable|string|max:100',
                'contacto_apellidos' => 'nullable|string|max:100',
                'contacto_identificacion' => 'nullable|string|max:50',
                'contacto_telefono' => 'nullable|string|max:50',
                'contacto_direccion' => 'nullable|string|max:255',
                'numero_cuentas_banco' => 'nullable|string',
                'estado' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Errores de validación',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Verificar si el NIT ya existe en otro proveedor de la misma empresa
            $existente = Proveedor::where('id_empresa', $proveedor->id_empresa)
                                  ->where('nit', $request->nit)
                                  ->where('id_proveedor', '!=', $id)
                                  ->first();

            if ($existente) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Ya existe otro proveedor con ese NIT en esta empresa'
                ], 422);
            }

            $proveedor->update($request->all());

            return response()->json([
                'error' => false,
                'mensaje' => 'Proveedor actualizado exitosamente',
                'proveedor' => $proveedor
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar proveedor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar (desactivar) un proveedor
     */
    public function eliminar($id)
    {
        try {
            $proveedor = Proveedor::find($id);

            if (!$proveedor) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Proveedor no encontrado'
                ], 404);
            }

            // Soft delete: cambiar estado a 0
            $proveedor->estado = 0;
            $proveedor->save();

            return response()->json([
                'error' => false,
                'mensaje' => 'Proveedor eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al eliminar proveedor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recibir proveedor desde VB6
     * POST: email, token_api, codigo, razon_social, nit, direccion, telefonos, nombres, apellidos, etc.
     */
    public function recibirDesdeVB6(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'token_api' => 'required|string',
                'codigo' => 'required',
                'razon_social' => 'required|string|max:200'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Validar credenciales
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

            // Verificar acceso
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

            // Buscar proveedor existente por codvb6
            $proveedor = Proveedor::where('id_empresa', $empresa->id_empresa)
                                  ->where('codvb6', $request->codigo)
                                  ->first();

            $datosProveedor = [
                'razon_social' => $request->razon_social,
                'nit' => $request->nit ?? '',
                'telefono' => $request->telefonos ?? '',
                'email' => $request->email_proveedor ?? null, // Email del proveedor (opcional)
                'direccion' => $request->direccion ?? '',
                'contacto_nombres' => $request->nombres ?? '',
                'contacto_apellidos' => $request->apellidos ?? '',
                'contacto_identificacion' => $request->identificacion ?? '',
                'contacto_telefono' => $request->telefonos_contacto ?? '',
                'contacto_direccion' => $request->direccion_contacto ?? '',
                'numero_cuentas_banco' => $request->cuenta_numero ?? '',
                'estado' => 1
            ];

            if ($proveedor) {
                $proveedor->update($datosProveedor);

                return response()->json([
                    'error' => false,
                    'mensaje' => 'Proveedor actualizado desde VB6',
                    'accion' => 'actualizada',
                    'proveedor' => $proveedor
                ]);
            } else {
                $datosProveedor['id_empresa'] = $empresa->id_empresa;
                $datosProveedor['codvb6'] = $request->codigo;
                $datosProveedor['codigo_proveedor'] = $request->codigo;

                $proveedor = Proveedor::create($datosProveedor);

                return response()->json([
                    'error' => false,
                    'mensaje' => 'Proveedor creado desde VB6',
                    'accion' => 'creada',
                    'proveedor' => $proveedor
                ], 201);
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al recibir proveedor desde VB6: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recibir lote de proveedores desde VB6 (batch)
     */
    public function recibirLoteDesdeVB6(Request $request)
    {
        try {
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

            // Validar credenciales
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

            $registros = $request->registros;
            $insertados = 0;
            $actualizados = 0;
            $errores = [];

            foreach ($registros as $index => $data) {
                try {
                    // Obtener valores (soporta ambos formatos: VB6 y genérico)
                    $codigo = $data['CodigoPro'] ?? $data['codigo'] ?? null;
                    $razonSocial = $data['RazonSocial'] ?? $data['razon_social'] ?? null;

                    if (empty($codigo) || empty($razonSocial)) {
                        $errores[] = "Registro $index: Faltan campos requeridos (codigo={$codigo}, razon_social={$razonSocial})";
                        continue;
                    }

                    // Corregir codificación UTF-8 de campos de texto
                    $datosProveedor = [
                        'razon_social' => EncodingHelper::fixEncoding($razonSocial),
                        'nit' => $data['Nit'] ?? $data['nit'] ?? '',
                        'telefono' => $data['Telefonos'] ?? $data['telefonos'] ?? '',
                        'email' => $data['Email'] ?? $data['email'] ?? null,
                        'direccion' => EncodingHelper::fixEncoding($data['Direccion'] ?? $data['direccion'] ?? ''),
                        'contacto_nombres' => EncodingHelper::fixEncoding($data['Nombres'] ?? $data['nombres'] ?? ''),
                        'contacto_apellidos' => EncodingHelper::fixEncoding($data['Apellidos'] ?? $data['apellidos'] ?? ''),
                        'contacto_identificacion' => $data['Identificacion'] ?? $data['identificacion'] ?? '',
                        'contacto_telefono' => $data['TelefonosContacto'] ?? $data['telefonos_contacto'] ?? '',
                        'contacto_direccion' => EncodingHelper::fixEncoding($data['DireccionContacto'] ?? $data['direccion_contacto'] ?? ''),
                        'numero_cuentas_banco' => $data['CuentaNumero'] ?? $data['cuenta_numero'] ?? '',
                        'estado' => 1
                    ];

                    // Usar updateOrCreate con codvb6 como clave única
                    $proveedor = Proveedor::updateOrCreate(
                        [
                            'id_empresa' => $empresa->id_empresa,
                            'codvb6' => $codigo
                        ],
                        array_merge($datosProveedor, [
                            'codigo_proveedor' => $codigo
                        ])
                    );

                    if ($proveedor->wasRecentlyCreated) {
                        $insertados++;
                    } else {
                        $actualizados++;
                    }
                } catch (\Exception $e) {
                    $errores[] = "Registro {$codigo}: " . $e->getMessage();
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
                'mensaje' => 'Error al procesar lote de proveedores: ' . $e->getMessage()
            ], 500);
        }
    }
}
