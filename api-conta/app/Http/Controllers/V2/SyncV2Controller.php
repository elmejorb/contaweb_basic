<?php

namespace App\Http\Controllers\V2;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\V2\Cliente;
use App\Models\V2\Compra;
use App\Models\V2\CompraItem;
use App\Models\V2\Gasto;
use App\Models\V2\Pago;
use App\Models\V2\Producto;
use App\Models\V2\Proveedor;
use App\Models\V2\SyncBatch;
use App\Models\V2\SyncItem;
use App\Models\V2\Venta;
use App\Models\V2\VentaItem;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Throwable;

/**
 * SyncV2Controller — ingesta sin pérdida.
 *
 * Protocolo:
 *   POST /sync/v2/{entidad}/batch
 *   Body: { email, token_api, items: [{idempotency_key, codigo_externo, fecha_actualizacion_origen, data}] }
 *
 * Garantías:
 *   - idempotency_key UNIQUE en sync_items → el mismo key llegado 2 veces NO se reprocesa.
 *   - Cada item recibe un ACK con status (ok|duplicate|rejected) + id_remoto.
 *   - El worker SOLO marca Enviado=1 cuando recibe el ACK de ese key.
 *   - Si la red se corta mid-response, el worker reenvía y el SaaS responde duplicate
 *     para los ya procesados → cero pérdida, cero duplicado.
 *
 * Mapeo de entidad → clase de modelo + handler está en self::ENTIDADES.
 */
class SyncV2Controller extends Controller
{
    /**
     * Mapa entidad → clase modelo + método handler. Cuando se agregue
     * productos/ventas/pagos, solo se agrega la línea correspondiente.
     */
    private const ENTIDADES = [
        'clientes'    => ['handler' => 'upsertCliente'],
        'productos'   => ['handler' => 'upsertProducto'],
        'proveedores' => ['handler' => 'upsertProveedor'],
        'ventas'      => ['handler' => 'upsertVenta'],
        'pagos'       => ['handler' => 'upsertPago'],
        'compras'     => ['handler' => 'upsertCompra'],
        'gastos'      => ['handler' => 'upsertGasto'],
    ];

    public function recibirLote(Request $request, string $entidad): JsonResponse
    {
        if (!isset(self::ENTIDADES[$entidad])) {
            return response()->json([
                'ok' => false,
                'error' => 'entidad_no_soportada',
                'mensaje' => "La entidad '{$entidad}' no está soportada por sync v2",
                'entidades_disponibles' => array_keys(self::ENTIDADES),
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'email'              => 'required|email',
            'token_api'          => 'required|string',
            'items'              => 'required|array|min:1|max:500',
            'items.*.idempotency_key'  => 'required|string|size:64',
            'items.*.codigo_externo'   => 'required|string|max:50',
            'items.*.fecha_actualizacion_origen' => 'nullable|date',
            'items.*.data'       => 'required|array',
        ]);
        if ($validator->fails()) {
            return response()->json([
                'ok' => false,
                'error' => 'validacion',
                'detalles' => $validator->errors(),
            ], 422);
        }

        // Resolver empresa por token_api (es tenancy sin login — el token_api
        // identifica a la empresa que paga el servicio).
        $empresa = Empresa::where('email_empresa', $request->email)
            ->where('token_crm', $request->token_api)
            ->first();
        if (!$empresa) {
            return response()->json([
                'ok' => false,
                'error' => 'auth_invalida',
                'mensaje' => 'email + token_api no coinciden con ninguna empresa activa',
            ], 401);
        }

        $items = $request->input('items');
        $batch = SyncBatch::create([
            'empresa_id' => $empresa->id_empresa,
            'entidad' => $entidad,
            'cantidad_items' => count($items),
            'ip_origen' => $request->ip(),
            'recibido_at' => Carbon::now(),
        ]);

        $acks = [];
        $aceptados = 0;
        $rechazados = 0;
        $duplicados = 0;

        $handler = self::ENTIDADES[$entidad]['handler'];

        foreach ($items as $item) {
            $key = $item['idempotency_key'];
            $codigoExterno = $item['codigo_externo'];

            // Detectar duplicate: si el idempotency_key ya existe,
            // devolvemos su ACK anterior sin reprocesar.
            $existente = SyncItem::where('idempotency_key', $key)->first();
            if ($existente) {
                $duplicados++;
                $acks[] = [
                    'idempotency_key' => $key,
                    'codigo_externo' => $codigoExterno,
                    'status' => 'duplicate',
                    'id_remoto' => $existente->id_remoto,
                ];
                continue;
            }

            try {
                DB::beginTransaction();

                $idRemoto = $this->$handler(
                    $empresa->id_empresa,
                    $codigoExterno,
                    $item['fecha_actualizacion_origen'] ?? null,
                    $item['data']
                );

                SyncItem::create([
                    'batch_id' => $batch->id,
                    'empresa_id' => $empresa->id_empresa,
                    'entidad' => $entidad,
                    'codigo_externo' => $codigoExterno,
                    'idempotency_key' => $key,
                    'status' => 'ok',
                    'id_remoto' => $idRemoto,
                    'procesado_at' => Carbon::now(),
                ]);

                DB::commit();
                $aceptados++;
                $acks[] = [
                    'idempotency_key' => $key,
                    'codigo_externo' => $codigoExterno,
                    'status' => 'ok',
                    'id_remoto' => $idRemoto,
                ];
            } catch (QueryException $e) {
                DB::rollBack();
                // Race: dos ciclos del worker pisándose. Si al rollback el
                // key ya existe, es el mismo caso que duplicate.
                if (SyncItem::where('idempotency_key', $key)->exists()) {
                    $otro = SyncItem::where('idempotency_key', $key)->first();
                    $duplicados++;
                    $acks[] = [
                        'idempotency_key' => $key,
                        'codigo_externo' => $codigoExterno,
                        'status' => 'duplicate',
                        'id_remoto' => $otro->id_remoto,
                    ];
                    continue;
                }
                $this->registrarRechazo($batch->id, $empresa->id_empresa, $entidad, $codigoExterno, $key, $e->getMessage());
                $rechazados++;
                $acks[] = [
                    'idempotency_key' => $key,
                    'codigo_externo' => $codigoExterno,
                    'status' => 'rejected',
                    'error' => $this->resumirError($e->getMessage()),
                ];
            } catch (Throwable $e) {
                DB::rollBack();
                $this->registrarRechazo($batch->id, $empresa->id_empresa, $entidad, $codigoExterno, $key, $e->getMessage());
                $rechazados++;
                $acks[] = [
                    'idempotency_key' => $key,
                    'codigo_externo' => $codigoExterno,
                    'status' => 'rejected',
                    'error' => $this->resumirError($e->getMessage()),
                ];
            }
        }

        // Actualizar totales del batch
        $batch->update([
            'aceptados' => $aceptados,
            'rechazados' => $rechazados,
            'duplicados' => $duplicados,
        ]);

        return response()->json([
            'ok' => true,
            'batch_id' => $batch->id,
            'recibidos' => count($items),
            'aceptados' => $aceptados,
            'duplicados' => $duplicados,
            'rechazados' => $rechazados,
            'acks' => $acks,
        ]);
    }

    private function registrarRechazo(int $batchId, int $empresaId, string $entidad, string $codigoExterno, string $key, string $errorMsg): void
    {
        // Nota: NO guardamos idempotency_key en sync_items al rechazar, porque
        // queremos que un reintento (misma key) tenga chance de reprocesarse
        // una vez que el emisor corrija el payload. Dejamos solo rastro en el batch.
        // Si querés rastrear rechazos permanentemente, descomentar:
        // SyncItem::create([... status => 'rejected', ...]);
    }

    private function resumirError(string $msg): string
    {
        return substr(preg_replace('/\s+/', ' ', $msg), 0, 300);
    }

    // =================================================================
    // Handlers por entidad — un método por tipo. Hace el upsert real.
    // Retorna el id (PK remota) de la fila insertada/actualizada.
    // =================================================================

    private function upsertCliente(int $empresaId, string $codigoExterno, ?string $fechaOrigen, array $data): int
    {
        $atributos = [
            'empresa_id' => $empresaId,
            'origen' => 'desktop_vb6',
            'codigo_externo' => $codigoExterno,
        ];

        $valores = [
            'razon_social' => $data['razon_social'] ?? ($data['Razon_Social'] ?? "Cliente {$codigoExterno}"),
            'tipo_documento_id' => $data['tipo_documento_id'] ?? null,
            'numero_documento' => $data['numero_documento'] ?? ($data['Nit'] ?? null),
            'dv' => $data['dv'] ?? null,
            'nombres' => $data['nombres'] ?? ($data['Nombres'] ?? null),
            'apellidos' => $data['apellidos'] ?? ($data['Apellidos'] ?? null),
            'email' => $data['email'] ?? ($data['Email'] ?? null),
            'telefono' => $data['telefono'] ?? ($data['Telefonos'] ?? null),
            'celular' => $data['celular'] ?? null,
            'whatsapp' => $data['whatsapp'] ?? ($data['Whatsapp'] ?? null),
            'direccion' => $data['direccion'] ?? ($data['Direccion'] ?? null),
            'ciudad' => $data['ciudad'] ?? null,
            'cupo_credito' => $data['cupo_credito'] ?? ($data['CupoAutorizado'] ?? 0),
            'dias_credito' => $data['dias_credito'] ?? ($data['Termino'] ?? 0),
            'fecha_nacimiento' => $this->fechaValida($data['fecha_nacimiento'] ?? ($data['FechaCumple'] ?? null)),
            'factura_a_precio_costo' => (bool) ($data['factura_a_precio_costo'] ?? ($data['Preciocosto'] ?? false)),
            'activo' => $data['activo'] ?? true,
            'fecha_actualizacion_origen' => $fechaOrigen,
        ];

        $cliente = Cliente::updateOrCreate($atributos, $valores);
        return $cliente->id;
    }

    /**
     * Rechaza fechas basura típicas de VB6 (1899-12-30, 0000-00-00).
     */
    private function fechaValida($f): ?string
    {
        if (!$f) return null;
        $s = is_string($f) ? $f : (string) $f;
        if (str_starts_with($s, '0000') || str_starts_with($s, '1899')) return null;
        return $s;
    }

    private function upsertProducto(int $empresaId, string $codigoExterno, ?string $fechaOrigen, array $data): int
    {
        $atributos = [
            'empresa_id' => $empresaId,
            'origen' => 'desktop_vb6',
            'codigo_externo' => $codigoExterno,
        ];
        $valores = [
            'codigo'          => $data['codigo'] ?? ($data['Codigo'] ?? null),
            'codigo_barras'   => $data['codigo_barras'] ?? ($data['CodigoB'] ?? null),
            'nombre'          => $data['nombre'] ?? ($data['Nombres_Articulo'] ?? "Producto {$codigoExterno}"),
            'descripcion'     => $data['descripcion'] ?? null,
            'precio_costo'    => $data['precio_costo'] ?? ($data['Precio_Costo'] ?? 0),
            'precio_venta'    => $data['precio_venta'] ?? ($data['Precio_Venta'] ?? 0),
            'precio_venta_2'  => $data['precio_venta_2'] ?? ($data['Precio_Venta2'] ?? 0),
            'precio_venta_3'  => $data['precio_venta_3'] ?? ($data['Precio_Venta3'] ?? 0),
            'precio_minimo'   => $data['precio_minimo'] ?? ($data['Precio_Minimo'] ?? 0),
            'existencia'      => $data['existencia'] ?? ($data['Existencia'] ?? 0),
            'existencia_minima' => $data['existencia_minima'] ?? ($data['Existencia_minima'] ?? 0),
            'es_servicio'     => (bool) ($data['es_servicio'] ?? ($data['Servicio'] ?? false)),
            'activo'          => $data['activo'] ?? true,
            'fecha_actualizacion_origen' => $fechaOrigen,
        ];
        return Producto::updateOrCreate($atributos, $valores)->id;
    }

    private function upsertProveedor(int $empresaId, string $codigoExterno, ?string $fechaOrigen, array $data): int
    {
        $atributos = [
            'empresa_id' => $empresaId,
            'origen' => 'desktop_vb6',
            'codigo_externo' => $codigoExterno,
        ];
        $valores = [
            'razon_social'      => $data['razon_social'] ?? ($data['RazonSocial'] ?? "Proveedor {$codigoExterno}"),
            'numero_documento'  => $data['numero_documento'] ?? ($data['Nit'] ?? null),
            'email'             => $data['email'] ?? null,
            'telefono'          => $data['telefono'] ?? ($data['Telefonos'] ?? null),
            'direccion'         => $data['direccion'] ?? ($data['Direccion'] ?? null),
            'cuenta_bancaria'   => $data['cuenta_bancaria'] ?? ($data['CuentaN'] ?? null),
            'activo'            => $data['activo'] ?? true,
            'fecha_actualizacion_origen' => $fechaOrigen,
        ];
        return Proveedor::updateOrCreate($atributos, $valores)->id;
    }

    /**
     * Upsert de venta. Resuelve cliente_id por codigo_externo del cliente.
     * Si el cliente aún no está sincronizado → lanza excepción y el ACK será
     * rejected (el worker lo reintentará cuando el cliente llegue).
     *
     * Al llegar los items (venta_items), los REEMPLAZA — una venta sincronizada
     * tiene el conjunto completo de líneas de ese momento.
     */
    private function upsertVenta(int $empresaId, string $codigoExterno, ?string $fechaOrigen, array $data): int
    {
        $codigoCli = $data['codigo_cliente'] ?? ($data['CodigoCli'] ?? null);
        if (!$codigoCli) {
            throw new \InvalidArgumentException("Falta codigo_cliente / CodigoCli");
        }
        $cliente = Cliente::where('empresa_id', $empresaId)
            ->where('origen', 'desktop_vb6')
            ->where('codigo_externo', (string) $codigoCli)
            ->first();
        if (!$cliente) {
            throw new \RuntimeException("Cliente {$codigoCli} no está sincronizado (sync primero)");
        }

        $itemsPayload = $data['items'] ?? ($data['detalles'] ?? []);

        $atributos = [
            'empresa_id' => $empresaId,
            'origen' => 'desktop_vb6',
            'codigo_externo' => $codigoExterno,
        ];
        $valores = [
            'numero_factura' => $data['numero_factura'] ?? ($data['Factura_N'] ?? $codigoExterno),
            'prefijo'        => $data['prefijo'] ?? null,
            'cliente_id'     => $cliente->id,
            'forma_pago_id'  => $this->mapFormaPago($data['tipo'] ?? ($data['Tipo'] ?? 'Contado'), $data['forma_pago_id'] ?? null),
            'fecha'          => $data['fecha'] ?? ($data['Fecha'] ?? Carbon::now()),
            'dias_credito'   => $data['dias_credito'] ?? ($data['Dias'] ?? 0),
            'subtotal'       => $data['subtotal'] ?? max(0, ($data['Total'] ?? 0) - ($data['Impuesto'] ?? 0)),
            'descuento'      => $data['descuento'] ?? ($data['Descuento'] ?? 0),
            'impuesto'       => $data['impuesto'] ?? ($data['Impuesto'] ?? 0),
            'total'          => $data['total'] ?? ($data['Total'] ?? 0),
            'abono'          => $data['abono'] ?? ($data['Abono'] ?? 0),
            'saldo'          => $data['saldo'] ?? ($data['Saldo'] ?? 0),
            'utilidad'       => $data['utilidad'] ?? 0,
            'costo_total'    => $data['costo_total'] ?? 0,
            'estado'         => $this->mapEstadoVenta($data['estado'] ?? ($data['EstadoFact'] ?? 'activa')),
            'observaciones'  => $data['observaciones'] ?? ($data['Comentario'] ?? null),
            'fecha_actualizacion_origen' => $fechaOrigen,
        ];

        $venta = Venta::updateOrCreate($atributos, $valores);

        // Reemplazar items (si vienen). El SaaS v2 trata venta_items como "parte
        // del documento" — no se sincronizan individualmente, llegan con su venta.
        if (!empty($itemsPayload)) {
            VentaItem::where('venta_id', $venta->id)->delete();
            $utilidadTotal = 0;
            $costoTotal = 0;
            foreach ($itemsPayload as $it) {
                $cant   = (float) ($it['cantidad']     ?? ($it['Cantidad']  ?? 0));
                $pCosto = (float) ($it['precio_costo'] ?? ($it['PrecioC']   ?? 0));
                $pVenta = (float) ($it['precio_venta'] ?? ($it['PrecioV']   ?? 0));
                $desc   = (float) ($it['descuento']    ?? ($it['Descuento'] ?? 0));
                $iva    = (float) ($it['porcentaje_iva'] ?? ($it['IVA']     ?? 0));
                $subtot = ($cant * $pVenta) - $desc;
                $imp    = (float) ($it['impuesto']  ?? ($it['Impuesto'] ?? ($subtot * $iva / 100)));
                $utilidadLinea = ($pVenta - $pCosto) * $cant;
                $utilidadTotal += $utilidadLinea;
                $costoTotal    += $pCosto * $cant;

                $prodId = null;
                $codigoItem = $it['codigo_externo_producto'] ?? ($it['Items'] ?? null);
                if ($codigoItem) {
                    $prod = Producto::where('empresa_id', $empresaId)
                        ->where('origen', 'desktop_vb6')
                        ->where('codigo_externo', (string) $codigoItem)
                        ->first();
                    if ($prod) $prodId = $prod->id;
                }

                VentaItem::create([
                    'venta_id'       => $venta->id,
                    'producto_id'    => $prodId,
                    'descripcion'    => $it['descripcion'] ?? ($it['DescripcionTemp'] ?? "Línea"),
                    'cantidad'       => $cant,
                    'precio_costo'   => $pCosto,
                    'precio_venta'   => $pVenta,
                    'descuento'      => $desc,
                    'porcentaje_iva' => $iva,
                    'impuesto'       => $imp,
                    'subtotal'       => $subtot,
                    'total'          => $subtot + $imp,
                    'utilidad'       => $utilidadLinea,
                    'entregado'      => true,
                ]);
            }
            // Si el payload no mandó utilidad/costo, los calculamos nosotros.
            if (empty($data['utilidad'])) {
                $venta->utilidad = $utilidadTotal;
            }
            if (empty($data['costo_total'])) {
                $venta->costo_total = $costoTotal;
            }
            $venta->save();
        }

        return $venta->id;
    }

    private function upsertPago(int $empresaId, string $codigoExterno, ?string $fechaOrigen, array $data): int
    {
        $codigoCli = $data['codigo_cliente'] ?? ($data['Codigo'] ?? null);
        if (!$codigoCli) {
            throw new \InvalidArgumentException("Falta codigo_cliente / Codigo");
        }
        $cliente = Cliente::where('empresa_id', $empresaId)
            ->where('origen', 'desktop_vb6')
            ->where('codigo_externo', (string) $codigoCli)
            ->first();
        if (!$cliente) {
            throw new \RuntimeException("Cliente {$codigoCli} no está sincronizado");
        }

        $ventaId = null;
        $factN = $data['codigo_externo_venta'] ?? ($data['Fact_N'] ?? null);
        if ($factN) {
            $v = Venta::where('empresa_id', $empresaId)
                ->where('origen', 'desktop_vb6')
                ->where('codigo_externo', (string) $factN)
                ->first();
            if ($v) $ventaId = $v->id;
        }

        $atributos = [
            'empresa_id' => $empresaId,
            'origen' => 'desktop_vb6',
            'codigo_externo' => $codigoExterno,
        ];
        $valores = [
            'cliente_id'    => $cliente->id,
            'venta_id'      => $ventaId,
            'forma_pago_id' => $data['forma_pago_id'] ?? 1,
            'fecha'         => $data['fecha'] ?? ($data['Fecha'] ?? Carbon::now()),
            'valor'         => $data['valor'] ?? ($data['ValorPago'] ?? 0),
            'descuento'     => $data['descuento'] ?? ($data['Descuento'] ?? 0),
            'retencion'     => $data['retencion'] ?? ($data['Retencion'] ?? 0),
            'observaciones' => $data['observaciones'] ?? ($data['DetallePago'] ?? null),
            'estado'        => ($data['estado'] ?? ($data['Estado'] ?? '')) === 'Anulada' ? 'anulado' : 'activo',
            'fecha_actualizacion_origen' => $fechaOrigen,
        ];
        $pago = Pago::updateOrCreate($atributos, $valores);

        // CRÍTICO: recalcular el saldo de la venta asociada.
        // Sin esto, la cartera (v_cartera_clientes) queda mostrando el saldo
        // anterior al pago aunque el pago sí se registre. El desktop reencola
        // la venta tras el pago, pero por si el /ventas/batch llega antes del
        // /pagos/batch o viceversa, acá cerramos la cuenta de forma autoritaria.
        if ($ventaId) {
            $this->recalcularSaldoVenta((int) $ventaId);
        }

        return $pago->id;
    }

    /**
     * Recalcula ventas.saldo = total − SUM(pagos activos − descuentos − retenciones).
     * Lo invocamos desde upsertPago para cerrar la cuenta cuando llega un pago,
     * y desde el command de recálculo retroactivo para arreglar cartera histórica.
     */
    private function recalcularSaldoVenta(int $ventaId): void
    {
        $venta = Venta::find($ventaId);
        if (!$venta) return;

        $aplicado = Pago::where('venta_id', $ventaId)
            ->where('estado', 'activo')
            ->selectRaw('COALESCE(SUM(valor), 0) - COALESCE(SUM(descuento), 0) - COALESCE(SUM(retencion), 0) AS total_aplicado')
            ->value('total_aplicado');

        $nuevoSaldo = max(0, (float) $venta->total - (float) $aplicado);
        if ((float) $venta->saldo === $nuevoSaldo) return; // ya está bien, no re-escribir

        $venta->saldo = $nuevoSaldo;
        $venta->abono = (float) $venta->total - $nuevoSaldo;
        $venta->save();
    }

    private function mapFormaPago(?string $tipoTexto, ?int $explicito): int
    {
        if ($explicito) return $explicito;
        $t = strtolower(trim((string) $tipoTexto));
        return match (true) {
            str_contains($t, 'credito') || str_contains($t, 'crédito') => 6,
            str_contains($t, 'transfer') => 2,
            str_contains($t, 'tarjeta')  => 3,
            str_contains($t, 'nequi')    => 4,
            str_contains($t, 'daviplata')=> 5,
            default => 1, // efectivo
        };
    }

    private function mapEstadoVenta(?string $estado): string
    {
        $e = strtolower(trim((string) $estado));
        return match (true) {
            str_contains($e, 'anul') => 'anulada',
            str_contains($e, 'devu') => 'devuelta',
            default => 'activa',
        };
    }

    /**
     * Upsert de compra. Resuelve proveedor_id por codigo_externo.
     * Si el proveedor aún no está sincronizado → rejected (worker reintenta).
     * Reemplaza items si vienen.
     */
    private function upsertCompra(int $empresaId, string $codigoExterno, ?string $fechaOrigen, array $data): int
    {
        $codigoProv = $data['codigo_proveedor'] ?? ($data['CodigoPro'] ?? null);
        if (!$codigoProv) {
            throw new \InvalidArgumentException("Falta codigo_proveedor / CodigoPro");
        }
        $prov = Proveedor::where('empresa_id', $empresaId)
            ->where('origen', 'desktop_vb6')
            ->where('codigo_externo', (string) $codigoProv)
            ->first();
        if (!$prov) {
            throw new \RuntimeException("Proveedor {$codigoProv} no está sincronizado (sync primero)");
        }

        $itemsPayload = $data['items'] ?? ($data['detalles'] ?? []);

        $atributos = [
            'empresa_id' => $empresaId,
            'origen' => 'desktop_vb6',
            'codigo_externo' => $codigoExterno,
        ];
        $valores = [
            'numero_factura' => $data['numero_factura'] ?? ($data['FacturaCompra_N'] ?? $codigoExterno),
            'proveedor_id'   => $prov->id,
            'forma_pago_id'  => $this->mapFormaPago($data['tipo'] ?? ($data['TipoPedido'] ?? 'Contado'), $data['forma_pago_id'] ?? null),
            'fecha'          => $data['fecha'] ?? ($data['Fecha'] ?? Carbon::now()),
            'dias_credito'   => $data['dias_credito'] ?? ($data['Dias'] ?? 0),
            'subtotal'       => $data['subtotal'] ?? max(0, ($data['Total'] ?? 0) - ($data['Impuesto'] ?? 0) - ($data['Flete'] ?? 0)),
            'descuento'      => $data['descuento'] ?? ($data['Descuento'] ?? 0),
            'impuesto'       => $data['impuesto'] ?? ($data['Impuesto'] ?? 0),
            'flete'          => $data['flete'] ?? ($data['Flete'] ?? 0),
            'total'          => $data['total'] ?? ($data['Total'] ?? 0),
            'abono'          => $data['abono'] ?? 0,
            'saldo'          => $data['saldo'] ?? ($data['Saldo'] ?? 0),
            'estado'         => str_contains(strtolower($data['estado'] ?? ($data['EstadoPedido'] ?? '')), 'anul') ? 'anulada' : 'activa',
            'observaciones'  => $data['observaciones'] ?? ($data['Comentario'] ?? null),
            'fecha_actualizacion_origen' => $fechaOrigen,
        ];

        $compra = Compra::updateOrCreate($atributos, $valores);

        if (!empty($itemsPayload)) {
            CompraItem::where('compra_id', $compra->id)->delete();
            foreach ($itemsPayload as $it) {
                $cant   = (float) ($it['cantidad']     ?? ($it['Cantidad']  ?? 0));
                $pCosto = (float) ($it['precio_costo'] ?? ($it['PrecioC']   ?? 0));
                $desc   = (float) ($it['descuento']    ?? ($it['Descuento'] ?? 0));
                $iva    = (float) ($it['porcentaje_iva'] ?? ($it['IVA']     ?? 0));
                $subtot = ($cant * $pCosto) - $desc;
                $imp    = (float) ($it['impuesto']  ?? ($it['Impuesto'] ?? ($subtot * $iva / 100)));

                $prodId = null;
                $codigoItem = $it['codigo_externo_producto'] ?? ($it['Items'] ?? null);
                if ($codigoItem) {
                    $prod = Producto::where('empresa_id', $empresaId)
                        ->where('origen', 'desktop_vb6')
                        ->where('codigo_externo', (string) $codigoItem)
                        ->first();
                    if ($prod) $prodId = $prod->id;
                }

                CompraItem::create([
                    'compra_id'      => $compra->id,
                    'producto_id'    => $prodId,
                    'descripcion'    => $it['descripcion'] ?? "Línea",
                    'cantidad'       => $cant,
                    'precio_costo'   => $pCosto,
                    'descuento'      => $desc,
                    'porcentaje_iva' => $iva,
                    'impuesto'       => $imp,
                    'subtotal'       => $subtot,
                    'total'          => $subtot + $imp,
                ]);
            }
        }

        return $compra->id;
    }

    /** Upsert de gasto — tabla simple sin FKs transaccionales. */
    private function upsertGasto(int $empresaId, string $codigoExterno, ?string $fechaOrigen, array $data): int
    {
        $atributos = [
            'empresa_id' => $empresaId,
            'origen' => 'desktop_vb6',
            'codigo_externo' => $codigoExterno,
        ];
        $valores = [
            'categoria'     => $data['categoria'] ?? ($data['categoria_gasto'] ?? 'otros'),
            'concepto'      => $data['concepto'] ?? ($data['Concepto'] ?? 'Sin concepto'),
            'fecha'         => $data['fecha'] ?? ($data['Fecha'] ?? Carbon::now()),
            'valor'         => $data['valor'] ?? ($data['Valor'] ?? 0),
            'forma_pago_id' => $data['forma_pago_id'] ?? 1,
            'beneficiario'  => $data['beneficiario'] ?? ($data['Beneficiario'] ?? null),
            'observaciones' => $data['observaciones'] ?? null,
            'estado'        => str_contains(strtolower($data['estado'] ?? ($data['Estado'] ?? '')), 'anul') ? 'anulado' : 'activo',
            'fecha_actualizacion_origen' => $fechaOrigen,
        ];
        return Gasto::updateOrCreate($atributos, $valores)->id;
    }
}
