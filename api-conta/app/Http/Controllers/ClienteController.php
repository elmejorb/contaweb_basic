<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Empresa;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Helpers\EncodingHelper;

class ClienteController extends Controller
{
    /**
     * Listar todos los clientes
     */
    public function index(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $query = Cliente::with(['vendedor']);

            // Filtro por empresa del usuario
            if ($request->has('id_empresa')) {
                $query->where('id_empresa', $request->id_empresa);
            }

            // Filtro por estado
            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            // Búsqueda por nombre, documento o código
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nombre_razon_social', 'like', "%{$search}%")
                      ->orWhere('numero_documento', 'like', "%{$search}%")
                      ->orWhere('codigo_cliente', 'like', "%{$search}%");
                });
            }

            // Ordenamiento
            $sortBy = $request->get('sortBy', 'created_at');
            $sortOrder = $request->get('sortOrder', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginación
            $perPage = $request->get('perPage', 10);
            $clientes = $query->paginate($perPage);

            return response()->json([
                'error' => false,
                'clientes' => $clientes->items(),
                'total' => $clientes->total(),
                'per_page' => $clientes->perPage(),
                'current_page' => $clientes->currentPage(),
                'last_page' => $clientes->lastPage()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener clientes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo cliente
     */
    public function store(Request $request)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $validator = Validator::make($request->all(), [
                'id_empresa' => 'required|exists:empresas,id_empresa',
                'nombre_razon_social' => 'required|string|max:255',
                'tipo_documento' => 'required|string|max:20',
                'numero_documento' => 'required|string|max:50',
                'digito_verificacion' => 'nullable|string|max:2',
                'telefono' => 'nullable|string|max:50',
                'celular' => 'nullable|string|max:50',
                'whatsapp' => 'nullable|string|max:50',
                'email' => 'nullable|email|max:100',
                'direccion' => 'nullable|string|max:255',
                'departamento' => 'nullable|string|max:100',
                'municipio' => 'nullable|string|max:100',
                'fecha_nacimiento' => 'nullable|date',
                'tipo_responsabilidad' => 'nullable|string|max:50',
                'tipo_adquiriente' => 'nullable|string|max:50',
                'regimen_tributario' => 'nullable|string|max:50',
                'contacto_nombres' => 'nullable|string|max:100',
                'contacto_apellidos' => 'nullable|string|max:100',
                'contacto_telefono' => 'nullable|string|max:50',
                'contacto_direccion' => 'nullable|string|max:255',
                'cupo_autorizado' => 'nullable|numeric|min:0',
                'id_vendedor' => 'nullable|exists:usuarios,id_usuario',
                'factura_precio_costo' => 'boolean',
                'facturar_con_vencimientos' => 'boolean',
                'facturar_solo_contado' => 'boolean',
                'estado' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Error de validación',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Verificar si ya existe un cliente con el mismo documento en la empresa
            $existe = Cliente::where('id_empresa', $request->id_empresa)
                ->where('numero_documento', $request->numero_documento)
                ->exists();

            if ($existe) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Ya existe un cliente con este número de documento en la empresa'
                ], 422);
            }

            // Generar código de cliente si no se proporciona
            if (!$request->codigo_cliente) {
                $ultimoCliente = Cliente::where('id_empresa', $request->id_empresa)
                    ->orderBy('id_cliente', 'desc')
                    ->first();
                $siguienteNumero = $ultimoCliente ? $ultimoCliente->id_cliente + 1 : 1;
                $codigoCliente = 'CLI' . str_pad($siguienteNumero, 6, '0', STR_PAD_LEFT);
            } else {
                $codigoCliente = $request->codigo_cliente;
            }

            $cliente = Cliente::create([
                'id_empresa' => $request->id_empresa,
                'codigo_cliente' => $codigoCliente,
                'nombre_razon_social' => $request->nombre_razon_social,
                'tipo_documento' => $request->tipo_documento,
                'numero_documento' => $request->numero_documento,
                'digito_verificacion' => $request->digito_verificacion,
                'telefono' => $request->telefono,
                'celular' => $request->celular,
                'whatsapp' => $request->whatsapp,
                'email' => $request->email,
                'direccion' => $request->direccion,
                'departamento' => $request->departamento,
                'municipio' => $request->municipio,
                'fecha_nacimiento' => $request->fecha_nacimiento,
                'tipo_responsabilidad' => $request->tipo_responsabilidad,
                'tipo_adquiriente' => $request->tipo_adquiriente,
                'regimen_tributario' => $request->regimen_tributario,
                'contacto_nombres' => $request->contacto_nombres,
                'contacto_apellidos' => $request->contacto_apellidos,
                'contacto_telefono' => $request->contacto_telefono,
                'contacto_direccion' => $request->contacto_direccion,
                'cupo_autorizado' => $request->cupo_autorizado ?? 0,
                'id_vendedor' => $request->id_vendedor,
                'factura_precio_costo' => $request->factura_precio_costo ?? false,
                'facturar_con_vencimientos' => $request->facturar_con_vencimientos ?? false,
                'facturar_solo_contado' => $request->facturar_solo_contado ?? false,
                'estado' => $request->estado ?? true
            ]);

            $cliente->load('vendedor');

            return response()->json([
                'error' => false,
                'mensaje' => 'Cliente creado exitosamente',
                'cliente' => $cliente
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear cliente: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mostrar un cliente específico
     */
    public function show($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $cliente = Cliente::with(['vendedor'])->findOrFail($id);

            return response()->json([
                'error' => false,
                'cliente' => $cliente
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Cliente no encontrado'
            ], 404);
        }
    }

    /**
     * Actualizar un cliente
     */
    public function update(Request $request, $id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $cliente = Cliente::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'nombre_razon_social' => 'required|string|max:255',
                'tipo_documento' => 'required|string|max:20',
                'numero_documento' => 'required|string|max:50',
                'digito_verificacion' => 'nullable|string|max:2',
                'telefono' => 'nullable|string|max:50',
                'celular' => 'nullable|string|max:50',
                'whatsapp' => 'nullable|string|max:50',
                'email' => 'nullable|email|max:100',
                'direccion' => 'nullable|string|max:255',
                'departamento' => 'nullable|string|max:100',
                'municipio' => 'nullable|string|max:100',
                'fecha_nacimiento' => 'nullable|date',
                'tipo_responsabilidad' => 'nullable|string|max:50',
                'tipo_adquiriente' => 'nullable|string|max:50',
                'regimen_tributario' => 'nullable|string|max:50',
                'contacto_nombres' => 'nullable|string|max:100',
                'contacto_apellidos' => 'nullable|string|max:100',
                'contacto_telefono' => 'nullable|string|max:50',
                'contacto_direccion' => 'nullable|string|max:255',
                'cupo_autorizado' => 'nullable|numeric|min:0',
                'id_vendedor' => 'nullable|exists:usuarios,id_usuario',
                'factura_precio_costo' => 'boolean',
                'facturar_con_vencimientos' => 'boolean',
                'facturar_solo_contado' => 'boolean',
                'estado' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Error de validación',
                    'errores' => $validator->errors()
                ], 422);
            }

            // Verificar si el documento ya existe en otro cliente
            $existe = Cliente::where('id_empresa', $cliente->id_empresa)
                ->where('numero_documento', $request->numero_documento)
                ->where('id_cliente', '!=', $id)
                ->exists();

            if ($existe) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Ya existe otro cliente con este número de documento en la empresa'
                ], 422);
            }

            $cliente->update([
                'nombre_razon_social' => $request->nombre_razon_social,
                'tipo_documento' => $request->tipo_documento,
                'numero_documento' => $request->numero_documento,
                'digito_verificacion' => $request->digito_verificacion,
                'telefono' => $request->telefono,
                'celular' => $request->celular,
                'whatsapp' => $request->whatsapp,
                'email' => $request->email,
                'direccion' => $request->direccion,
                'departamento' => $request->departamento,
                'municipio' => $request->municipio,
                'fecha_nacimiento' => $request->fecha_nacimiento,
                'tipo_responsabilidad' => $request->tipo_responsabilidad,
                'tipo_adquiriente' => $request->tipo_adquiriente,
                'regimen_tributario' => $request->regimen_tributario,
                'contacto_nombres' => $request->contacto_nombres,
                'contacto_apellidos' => $request->contacto_apellidos,
                'contacto_telefono' => $request->contacto_telefono,
                'contacto_direccion' => $request->contacto_direccion,
                'cupo_autorizado' => $request->cupo_autorizado ?? 0,
                'id_vendedor' => $request->id_vendedor,
                'factura_precio_costo' => $request->factura_precio_costo ?? false,
                'facturar_con_vencimientos' => $request->facturar_con_vencimientos ?? false,
                'facturar_solo_contado' => $request->facturar_solo_contado ?? false,
                'estado' => $request->estado ?? true
            ]);

            $cliente->load('vendedor');

            return response()->json([
                'error' => false,
                'mensaje' => 'Cliente actualizado exitosamente',
                'cliente' => $cliente
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar cliente: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar (desactivar) un cliente
     */
    public function destroy($id)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            $cliente = Cliente::findOrFail($id);
            $cliente->update(['estado' => false]);

            return response()->json([
                'error' => false,
                'mensaje' => 'Cliente desactivado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al desactivar cliente: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recibir cliente desde VB6
     * POST: email, token_api, codigo, razon_social, nit, direccion, telefonos, email_cliente, cupo_autorizado, id_documento
     */
    public function recibirDesdeVB6(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'token_api' => 'required|string',
                'codigo' => 'required',
                'razon_social' => 'required|string|max:255'
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

            // Buscar cliente existente por codvb6
            $cliente = Cliente::where('id_empresa', $empresa->id_empresa)
                              ->where('codvb6', $request->codigo)
                              ->first();

            // Mapear tipo de documento
            $tipoDocumento = 'CC'; // Por defecto Cédula
            if ($request->has('id_documento')) {
                $mapeoDocumentos = [
                    1 => 'CC',   // Cédula de Ciudadanía
                    2 => 'NIT',  // NIT
                    3 => 'CE',   // Cédula de Extranjería
                    4 => 'TI',   // Tarjeta de Identidad
                    5 => 'PP',   // Pasaporte
                ];
                $tipoDocumento = $mapeoDocumentos[$request->id_documento] ?? 'CC';
            }

            // Parsear fecha de nacimiento (fecha_cumple)
            $fechaNacimiento = null;
            if ($request->has('fecha_cumple') && !empty($request->fecha_cumple)) {
                try {
                    $fechaNacimiento = \Carbon\Carbon::createFromFormat('d/m/Y', $request->fecha_cumple)->format('Y-m-d');
                } catch (\Exception $e) {
                    try {
                        $fechaNacimiento = \Carbon\Carbon::parse($request->fecha_cumple)->format('Y-m-d');
                    } catch (\Exception $e) {
                        $fechaNacimiento = null;
                    }
                }
            }

            $datosCliente = [
                'nombre_razon_social' => $request->razon_social,
                'tipo_documento' => $tipoDocumento,
                'numero_documento' => $request->nit ?? '',
                'telefono' => $request->telefonos ?? '',
                'email' => $request->email_cliente ?? '',
                'direccion' => $request->direccion ?? '',
                'cupo_autorizado' => $request->cupo_autorizado ?? 0,
                // Nuevos campos VB6
                'municipio' => $request->id_municipio ?? null,
                'tipo_responsabilidad' => $request->id_type_liability ?? null,
                'tipo_adquiriente' => $request->id_type_organization ?? null,
                'regimen_tributario' => $request->id_type_regime ?? null,
                'celular' => $request->ceular ?? null,
                'whatsapp' => $request->whatsapp ?? null,
                'contacto_nombres' => $request->nombre_c ?? null,
                'contacto_apellidos' => $request->apellidos_c ?? null,
                'contacto_telefono' => $request->telefonos_c ?? null,
                'contacto_direccion' => $request->direccion_c ?? null,
                'fecha_nacimiento' => $fechaNacimiento,
                'facturar_solo_contado' => $request->has('termino') ? (bool)$request->termino : false,
                'facturar_con_vencimientos' => $request->has('fac_venc') ? (bool)$request->fac_venc : false,
                'factura_precio_costo' => $request->has('preciocosto') ? (bool)$request->preciocosto : false,
                'estado' => 1
            ];

            if ($cliente) {
                $cliente->update($datosCliente);

                return response()->json([
                    'error' => false,
                    'mensaje' => 'Cliente actualizado desde VB6',
                    'accion' => 'actualizada',
                    'cliente' => $cliente
                ]);
            } else {
                $datosCliente['id_empresa'] = $empresa->id_empresa;
                $datosCliente['codvb6'] = $request->codigo;
                $datosCliente['codigo_cliente'] = $request->codigo;

                $cliente = Cliente::create($datosCliente);

                return response()->json([
                    'error' => false,
                    'mensaje' => 'Cliente creado desde VB6',
                    'accion' => 'creada',
                    'cliente' => $cliente
                ], 201);
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al recibir cliente desde VB6: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recibir lote de clientes desde VB6 (batch)
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

            $mapeoDocumentos = [
                1 => 'CC', 2 => 'NIT', 3 => 'CE', 4 => 'TI', 5 => 'PP',
            ];

            foreach ($registros as $index => $data) {
                try {
                    // Normalizar nombres de campos VB6 a formato esperado
                    $codigo = $data['CodigoClien'] ?? $data['codigo'] ?? null;
                    $razonSocial = $data['Razon_Social'] ?? $data['razon_social'] ?? null;
                    $nit = $data['Nit'] ?? $data['nit'] ?? '';
                    $direccion = $data['Direccion'] ?? $data['direccion'] ?? '';
                    $telefonos = $data['Telefonos'] ?? $data['telefonos'] ?? '';
                    $email = $data['Email'] ?? $data['email_cliente'] ?? '';
                    $cupoAutorizado = $data['CupoAutorizado'] ?? $data['cupo_autorizado'] ?? 0;

                    if (empty($codigo) || empty($razonSocial)) {
                        $errores[] = "Registro $index: Faltan campos requeridos (codigo={$codigo}, razon_social={$razonSocial})";
                        continue;
                    }

                    $tipoDocumento = $mapeoDocumentos[$data['id_documento'] ?? 1] ?? 'CC';

                    // Parsear fecha de nacimiento (fecha_cumple)
                    $fechaNacimiento = null;
                    if (!empty($data['fecha_cumple'])) {
                        try {
                            $fechaNacimiento = \Carbon\Carbon::createFromFormat('d/m/Y', $data['fecha_cumple'])->format('Y-m-d');
                        } catch (\Exception $e) {
                            // Si falla el parseo, intentar otro formato o dejarlo null
                            try {
                                $fechaNacimiento = \Carbon\Carbon::parse($data['fecha_cumple'])->format('Y-m-d');
                            } catch (\Exception $e) {
                                $fechaNacimiento = null;
                            }
                        }
                    }

                    // Corregir codificación UTF-8 para campos de texto
                    $datosCliente = [
                        'nombre_razon_social' => EncodingHelper::fixEncoding($razonSocial),
                        'tipo_documento' => $tipoDocumento,
                        'numero_documento' => $nit,
                        'telefono' => $telefonos,
                        'email' => $email,
                        'direccion' => EncodingHelper::fixEncoding($direccion),
                        'cupo_autorizado' => $cupoAutorizado,
                        // Nuevos campos VB6
                        'municipio' => $data['id_municipio'] ?? null,
                        'tipo_responsabilidad' => $data['id_type_liability'] ?? null,
                        'tipo_adquiriente' => $data['id_type_organization'] ?? null,
                        'regimen_tributario' => $data['id_type_regime'] ?? null,
                        'celular' => $data['ceular'] ?? null,
                        'whatsapp' => $data['whatsapp'] ?? null,
                        'contacto_nombres' => EncodingHelper::fixEncoding($data['nombre_c'] ?? null),
                        'contacto_apellidos' => EncodingHelper::fixEncoding($data['apellidos_c'] ?? null),
                        'contacto_telefono' => $data['telefonos_c'] ?? null,
                        'contacto_direccion' => EncodingHelper::fixEncoding($data['direccion_c'] ?? null),
                        'fecha_nacimiento' => $fechaNacimiento,
                        'facturar_solo_contado' => isset($data['termino']) ? (bool)$data['termino'] : false,
                        'facturar_con_vencimientos' => isset($data['fac_venc']) ? (bool)$data['fac_venc'] : false,
                        'factura_precio_costo' => isset($data['preciocosto']) ? (bool)$data['preciocosto'] : false,
                        'estado' => 1
                    ];

                    $cliente = Cliente::where('id_empresa', $empresa->id_empresa)
                                      ->where('codvb6', $codigo)
                                      ->first();

                    if ($cliente) {
                        $cliente->update($datosCliente);
                        $actualizados++;
                    } else {
                        $datosCliente['id_empresa'] = $empresa->id_empresa;
                        $datosCliente['codvb6'] = $codigo;
                        $datosCliente['codigo_cliente'] = $codigo;
                        // fecha_ingreso = fecha de creación (se maneja automáticamente con created_at)
                        Cliente::create($datosCliente);
                        $insertados++;
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
                'mensaje' => 'Error al procesar lote de clientes: ' . $e->getMessage()
            ], 500);
        }
    }
}
