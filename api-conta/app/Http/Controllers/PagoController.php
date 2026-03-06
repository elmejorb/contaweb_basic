<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pago;
use App\Models\Usuario;
use App\Models\Empresa;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PagoController extends Controller
{
    /**
     * Listar pagos de una empresa
     */
    public function listar(Request $request)
    {
        try {
            $empresaId = $request->input('id_empresa');
            $perPage = $request->input('perPage', 50);
            $page = $request->input('page', 1);
            $buscar = $request->input('buscar');
            $facturaN = $request->input('factura_n');
            $fechaInicio = $request->input('fecha_inicio');
            $fechaFin = $request->input('fecha_fin');

            if (!$empresaId) {
                return response()->json(['error' => true, 'mensaje' => 'Debe proporcionar id_empresa'], 400);
            }

            $query = Pago::where('id_empresa', $empresaId)->orderBy('fecha', 'DESC')->orderBy('id_pago', 'DESC');

            if ($facturaN) {
                $query->where('factura_n', $facturaN);
            }

            if ($fechaInicio) {
                $query->where('fecha', '>=', $fechaInicio);
            }
            if ($fechaFin) {
                $query->where('fecha', '<=', $fechaFin);
            }

            if ($buscar) {
                $query->where(function ($q) use ($buscar) {
                    $q->where('codigo_cliente', 'like', "%{$buscar}%")
                      ->orWhere('detalle_pago', 'like', "%{$buscar}%")
                      ->orWhere('recibido_de', 'like', "%{$buscar}%")
                      ->orWhere('factura_n', 'like', "%{$buscar}%");
                });
            }

            $total = $query->count();
            $pagos = $query->skip(($page - 1) * $perPage)->take($perPage)->get();

            return response()->json([
                'error' => false,
                'pagos' => $pagos,
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => (int) $page,
                'last_page' => ceil($total / $perPage)
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => true, 'mensaje' => 'Error al listar pagos: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Recibir lote de pagos desde VB6/Electron
     */
    public function recibirLoteDesdeVB6(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'token_api' => 'required|string',
                'registros' => 'required|array|min:1|max:500'
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
                    'mensaje' => 'Credenciales inválidas - Usuario no encontrado'
                ], 401);
            }

            $empresa = Empresa::where('token_api', $request->token_api)->first();
            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Credenciales inválidas - Token API no encontrado'
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

            $registros = $request->registros;
            $insertados = 0;
            $actualizados = 0;
            $errores = [];

            DB::beginTransaction();

            foreach ($registros as $index => $data) {
                try {
                    $idPagoVb6 = $data['Id_Pagos'] ?? $data['id_pagos'] ?? null;

                    if (!$idPagoVb6) {
                        $errores[] = "Registro $index: Falta Id_Pagos";
                        continue;
                    }

                    $fecha = null;
                    if (!empty($data['Fecha'])) {
                        $fecha = date('Y-m-d', strtotime($data['Fecha']));
                    }

                    $pago = Pago::updateOrCreate(
                        [
                            'id_empresa' => $empresa->id_empresa,
                            'id_pago_vb6' => $idPagoVb6
                        ],
                        [
                            'rec_caja_n' => $data['RecCajaN'] ?? null,
                            'codigo_cliente' => $data['Codigo'] ?? null,
                            'factura_n' => $data['Fact_N'] ?? null,
                            'valor_pago' => $data['ValorPago'] ?? 0,
                            'fecha' => $fecha,
                            'detalle_pago' => $data['DetallePago'] ?? null,
                            'valor_factura' => $data['ValorFact'] ?? 0,
                            'saldo_actual' => $data['SaldoAct'] ?? 0,
                            'descuento' => $data['Descuento'] ?? 0,
                            'retencion' => $data['Retencion'] ?? 0,
                            'iva_retenido' => $data['IVARetenido'] ?? 0,
                            'estado' => $data['Estado'] ?? null,
                            'saldo_total' => $data['SaldoTotal'] ?? 0,
                            'cedula' => $data['Cedula'] ?? null,
                            'recibido_de' => $data['RecibidoDe'] ?? null,
                        ]
                    );

                    if ($pago->wasRecentlyCreated) {
                        $insertados++;
                    } else {
                        $actualizados++;
                    }

                } catch (\Exception $e) {
                    $errores[] = "Registro $index (Id_Pagos: {$idPagoVb6}): " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'error' => false,
                'mensaje' => 'Lote de pagos procesado exitosamente',
                'resultado' => [
                    'insertados' => $insertados,
                    'actualizados' => $actualizados,
                    'total_procesados' => $insertados + $actualizados,
                    'errores' => count($errores),
                    'detalles_errores' => $errores
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al procesar lote de pagos: ' . $e->getMessage()
            ], 500);
        }
    }
}
