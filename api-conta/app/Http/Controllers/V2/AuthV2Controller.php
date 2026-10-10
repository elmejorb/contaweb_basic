<?php

namespace App\Http\Controllers\V2;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;

/**
 * AuthV2Controller — login y gestión de perfil para el dashboard mobile.
 *
 * Modelo:
 *   - Usuario tiene email+password+token_us
 *   - token_us (hex 64) es el "session token" — se persiste en localStorage
 *     del cliente y se pasa en cada request del dashboard como ?token=...
 *   - Un usuario puede estar vinculado a N empresas (tabla usuarios_empresas)
 *   - Para vincular una empresa, el usuario pega el token_crm de esa empresa
 *     (el que recibe del CRM). El backend busca empresas.token_crm=X y crea
 *     la asociación.
 */
class AuthV2Controller extends Controller
{
    /** POST /v2/auth/login — email + password → token + user + empresas */
    public function login(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string|min:3',
        ]);
        if ($v->fails()) {
            return response()->json(['ok' => false, 'error' => 'validacion', 'detalles' => $v->errors()], 422);
        }

        $u = DB::table('usuarios')->where('email_us', $request->email)->first();
        if (!$u) {
            return response()->json(['ok' => false, 'error' => 'credenciales'], 401);
        }

        // password_us puede estar en Hash::make (bcrypt) o en texto plano (datos viejos)
        $ok = false;
        if ($u->password_us) {
            if (Hash::needsRehash($u->password_us)) {
                // viejo: comparar texto plano
                $ok = $u->password_us === $request->password;
            } else {
                $ok = Hash::check($request->password, $u->password_us);
            }
        }
        if (!$ok) {
            return response()->json(['ok' => false, 'error' => 'credenciales'], 401);
        }

        // Generar token si no tiene (o si querés rotarlo cada login — por ahora lo mantengo)
        $token = $u->token_us ?: bin2hex(random_bytes(32));
        if (!$u->token_us) {
            DB::table('usuarios')->where('id_usuario', $u->id_usuario)->update([
                'token_us' => $token, 'updated_at' => Carbon::now(),
            ]);
        }

        return response()->json([
            'ok' => true,
            'token' => $token,
            'usuario' => [
                'id'     => $u->id_usuario,
                'nombre' => $u->nombre_us,
                'email'  => $u->email_us,
                'avatar' => $u->avatar,
            ],
            'empresas' => $this->empresasDelUsuario($u->id_usuario),
        ]);
    }

    /** POST /v2/auth/registrar — crear usuario (self-service) */
    public function registrar(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'nombre'   => 'required|string|max:100',
            'email'    => 'required|email|max:100',
            'password' => 'required|string|min:6',
        ]);
        if ($v->fails()) {
            return response()->json(['ok' => false, 'error' => 'validacion', 'detalles' => $v->errors()], 422);
        }
        if (DB::table('usuarios')->where('email_us', $request->email)->exists()) {
            return response()->json(['ok' => false, 'error' => 'email_duplicado'], 409);
        }

        $token = bin2hex(random_bytes(32));
        $id = DB::table('usuarios')->insertGetId([
            'nombre_us'      => $request->nombre,
            'email_us'       => $request->email,
            'password_us'    => Hash::make($request->password),
            'id_tipo_usuario'=> 1,
            'tipologin'      => 'r',
            'token_us'       => $token,
            'email_validado' => 'N',
            'estado_us'      => 1,
            'cambio_password'=> 'N',
            'created_at'     => Carbon::now(),
            'updated_at'     => Carbon::now(),
        ]);

        return response()->json([
            'ok' => true,
            'token' => $token,
            'usuario' => [
                'id'     => $id,
                'nombre' => $request->nombre,
                'email'  => $request->email,
            ],
            'empresas' => [],
        ]);
    }

    /** GET /v2/auth/perfil — ?token=X */
    public function perfil(Request $request): JsonResponse
    {
        $u = $this->resolverUsuario($request);
        if (!$u) return response()->json(['ok' => false, 'error' => 'token_invalido'], 401);

        return response()->json([
            'ok' => true,
            'usuario' => [
                'id'     => $u->id_usuario,
                'nombre' => $u->nombre_us,
                'email'  => $u->email_us,
                'avatar' => $u->avatar,
            ],
            'empresas' => $this->empresasDelUsuario($u->id_usuario),
        ]);
    }

    /** PUT /v2/auth/perfil — editar nombre y/o password */
    public function actualizarPerfil(Request $request): JsonResponse
    {
        $u = $this->resolverUsuario($request);
        if (!$u) return response()->json(['ok' => false, 'error' => 'token_invalido'], 401);

        $v = Validator::make($request->all(), [
            'nombre'           => 'sometimes|string|max:100',
            'password_actual'  => 'sometimes|string',
            'password_nuevo'   => 'sometimes|string|min:6',
        ]);
        if ($v->fails()) {
            return response()->json(['ok' => false, 'error' => 'validacion', 'detalles' => $v->errors()], 422);
        }

        $cambios = ['updated_at' => Carbon::now()];
        if ($request->filled('nombre')) {
            $cambios['nombre_us'] = $request->nombre;
        }

        if ($request->filled('password_nuevo')) {
            if (!$request->filled('password_actual')) {
                return response()->json(['ok' => false, 'error' => 'falta_password_actual'], 422);
            }
            $actualOk = Hash::needsRehash($u->password_us)
                ? ($u->password_us === $request->password_actual)
                : Hash::check($request->password_actual, $u->password_us);
            if (!$actualOk) {
                return response()->json(['ok' => false, 'error' => 'password_actual_incorrecto'], 401);
            }
            $cambios['password_us'] = Hash::make($request->password_nuevo);
        }

        DB::table('usuarios')->where('id_usuario', $u->id_usuario)->update($cambios);

        return response()->json(['ok' => true, 'actualizado' => array_keys($cambios)]);
    }

    /** POST /v2/empresas/vincular — pega el token_crm, lo asocia al usuario */
    public function vincularEmpresa(Request $request): JsonResponse
    {
        $u = $this->resolverUsuario($request);
        if (!$u) return response()->json(['ok' => false, 'error' => 'token_invalido'], 401);

        $v = Validator::make($request->all(), [
            'token_crm' => 'required|string|size:64',
        ]);
        if ($v->fails()) {
            return response()->json(['ok' => false, 'error' => 'validacion', 'detalles' => $v->errors()], 422);
        }

        $empresa = Empresa::where('token_crm', $request->token_crm)->first();
        if (!$empresa) {
            // Más adelante: aquí validar el token contra el CRM y crear la empresa
            // si no existe. Por ahora solo asociamos empresas ya existentes.
            return response()->json([
                'ok' => false,
                'error' => 'empresa_no_encontrada',
                'mensaje' => 'El token no coincide con ninguna empresa registrada. Verificá que la empresa haya hecho sync al menos una vez.',
            ], 404);
        }

        $yaVinculada = DB::table('usuarios_empresas')
            ->where('id_usuario', $u->id_usuario)
            ->where('id_empresa', $empresa->id_empresa)
            ->exists();
        if ($yaVinculada) {
            return response()->json([
                'ok' => false,
                'error' => 'ya_vinculada',
                'empresa' => ['id' => $empresa->id_empresa, 'nombre' => $empresa->nombre_empresa],
            ], 409);
        }

        DB::table('usuarios_empresas')->insert([
            'id_usuario' => $u->id_usuario,
            'id_empresa' => $empresa->id_empresa,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        return response()->json([
            'ok' => true,
            'empresa' => [
                'id' => $empresa->id_empresa,
                'nombre' => $empresa->nombre_empresa,
                'nit' => $empresa->nit_empresa,
            ],
            'total_empresas' => count($this->empresasDelUsuario($u->id_usuario)),
        ]);
    }

    /** DELETE /v2/empresas/{id}/desvincular */
    public function desvincularEmpresa(Request $request, int $id): JsonResponse
    {
        $u = $this->resolverUsuario($request);
        if (!$u) return response()->json(['ok' => false, 'error' => 'token_invalido'], 401);

        $borradas = DB::table('usuarios_empresas')
            ->where('id_usuario', $u->id_usuario)
            ->where('id_empresa', $id)
            ->delete();

        return response()->json(['ok' => true, 'borradas' => $borradas]);
    }

    // --------- Helpers compartidos ---------

    public static function resolverUsuario(Request $request)
    {
        $token = $request->query('token') ?: $request->header('X-Session-Token');
        if (!$token) return null;
        return DB::table('usuarios')->where('token_us', $token)->first();
    }

    public static function empresasDelUsuario(int $usuarioId): array
    {
        return DB::table('empresas as e')
            ->join('usuarios_empresas as ue', 'ue.id_empresa', '=', 'e.id_empresa')
            ->where('ue.id_usuario', $usuarioId)
            ->orderBy('e.nombre_empresa')
            ->get(['e.id_empresa', 'e.nombre_empresa', 'e.nit_empresa'])
            ->toArray();
    }
}
