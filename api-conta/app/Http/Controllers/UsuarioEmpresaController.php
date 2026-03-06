<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\Empresa;
use App\Models\TipoUsuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class UsuarioEmpresaController extends Controller
{
    /**
     * Listar usuarios de la empresa
     */
    public function listar(Request $request, $empresaId)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $empresaId)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'No tienes acceso a esta empresa'
                ], 403);
            }

            // Obtener todos los usuarios de la empresa con su tipo
            $usuarios = $empresa->usuarios()
                ->select('usuarios.*')
                ->with('tipoUsuario:id_tipo_usuario,nombre_tipo')
                ->get()
                ->map(function($user) {
                    return [
                        'id_usuario' => $user->id_usuario,
                        'nombre_us' => $user->nombre_us,
                        'email_us' => $user->email_us,
                        'avatar' => $user->avatar,
                        'tipo_usuario' => $user->tipoUsuario ? $user->tipoUsuario->nombre_tipo : 'Usuario',
                        'id_tipo_usuario' => $user->id_tipo_usuario,
                        'estado_us' => $user->estado_us,
                        'email_validado' => $user->email_validado,
                        'created_at' => $user->created_at
                    ];
                });

            return response()->json([
                'error' => false,
                'usuarios' => $usuarios
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener usuarios: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear usuario para la empresa
     */
    public function crear(Request $request, $empresaId)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $empresaId)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'No tienes acceso a esta empresa'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'nombre_us' => 'required|string|max:100',
                'email_us' => 'required|email|max:100|unique:usuarios,email_us',
                'password' => 'required|string|min:6',
                'id_tipo_usuario' => 'required|exists:tipos_usuario,id_tipo_usuario'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            try {
                // Crear usuario
                $nuevoUsuario = Usuario::create([
                    'nombre_us' => $request->nombre_us,
                    'email_us' => $request->email_us,
                    'password_us' => Hash::make($request->password),
                    'id_tipo_usuario' => $request->id_tipo_usuario,
                    'estado_us' => 1,
                    'email_validado' => 'S',
                    'tipologin' => 'r'
                ]);

                // Asociar usuario a la empresa
                DB::table('usuarios_empresas')->insert([
                    'id_usuario' => $nuevoUsuario->id_usuario,
                    'id_empresa' => $empresaId,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                DB::commit();

                // Cargar relación de tipo de usuario
                $nuevoUsuario->load('tipoUsuario:id_tipo_usuario,nombre_tipo');

                return response()->json([
                    'error' => false,
                    'mensaje' => 'Usuario creado exitosamente',
                    'usuario' => [
                        'id_usuario' => $nuevoUsuario->id_usuario,
                        'nombre_us' => $nuevoUsuario->nombre_us,
                        'email_us' => $nuevoUsuario->email_us,
                        'tipo_usuario' => $nuevoUsuario->tipoUsuario->nombre_tipo,
                        'id_tipo_usuario' => $nuevoUsuario->id_tipo_usuario,
                        'estado_us' => $nuevoUsuario->estado_us
                    ]
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al crear usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar usuario de la empresa
     */
    public function actualizar(Request $request, $empresaId, $usuarioId)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $empresaId)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'No tienes acceso a esta empresa'
                ], 403);
            }

            // Verificar que el usuario a editar pertenezca a la empresa
            $usuarioEditar = $empresa->usuarios()->where('usuarios.id_usuario', $usuarioId)->first();

            if (!$usuarioEditar) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Usuario no encontrado en esta empresa'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nombre_us' => 'required|string|max:100',
                'email_us' => 'required|email|max:100|unique:usuarios,email_us,' . $usuarioId . ',id_usuario',
                'id_tipo_usuario' => 'required|exists:tipos_usuario,id_tipo_usuario',
                'password' => 'nullable|string|min:6'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Datos inválidos',
                    'errores' => $validator->errors()
                ], 422);
            }

            $dataToUpdate = [
                'nombre_us' => $request->nombre_us,
                'email_us' => $request->email_us,
                'id_tipo_usuario' => $request->id_tipo_usuario
            ];

            // Actualizar password solo si se proporciona
            if ($request->filled('password')) {
                $dataToUpdate['password_us'] = Hash::make($request->password);
            }

            $usuarioEditar->update($dataToUpdate);

            // Cargar relación de tipo de usuario
            $usuarioEditar->load('tipoUsuario:id_tipo_usuario,nombre_tipo');

            return response()->json([
                'error' => false,
                'mensaje' => 'Usuario actualizado exitosamente',
                'usuario' => [
                    'id_usuario' => $usuarioEditar->id_usuario,
                    'nombre_us' => $usuarioEditar->nombre_us,
                    'email_us' => $usuarioEditar->email_us,
                    'tipo_usuario' => $usuarioEditar->tipoUsuario->nombre_tipo,
                    'id_tipo_usuario' => $usuarioEditar->id_tipo_usuario,
                    'estado_us' => $usuarioEditar->estado_us
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al actualizar usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar estado del usuario (activar/desactivar)
     */
    public function cambiarEstado(Request $request, $empresaId, $usuarioId)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $empresaId)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'No tienes acceso a esta empresa'
                ], 403);
            }

            // Verificar que el usuario a editar pertenezca a la empresa
            $usuarioEditar = $empresa->usuarios()->where('usuarios.id_usuario', $usuarioId)->first();

            if (!$usuarioEditar) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'Usuario no encontrado en esta empresa'
                ], 404);
            }

            // No permitir desactivarse a sí mismo
            if ($usuario->id_usuario == $usuarioId) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'No puedes cambiar tu propio estado'
                ], 400);
            }

            $nuevoEstado = $usuarioEditar->estado_us == 1 ? 0 : 1;
            $usuarioEditar->estado_us = $nuevoEstado;
            $usuarioEditar->save();

            return response()->json([
                'error' => false,
                'mensaje' => $nuevoEstado == 1 ? 'Usuario activado' : 'Usuario desactivado',
                'estado_us' => $nuevoEstado
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al cambiar estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener tipos de usuario disponibles
     */
    public function tiposUsuario()
    {
        try {
            $tipos = TipoUsuario::select('id_tipo_usuario', 'nombre_tipo')
                ->orderBy('nombre_tipo')
                ->get();

            return response()->json([
                'error' => false,
                'tipos_usuario' => $tipos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al obtener tipos de usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar usuario de la empresa (quitar asociación)
     */
    public function eliminar($empresaId, $usuarioId)
    {
        try {
            $usuario = JWTAuth::parseToken()->authenticate();

            // Verificar que el usuario tenga acceso a esta empresa
            $empresa = $usuario->empresas()->where('empresas.id_empresa', $empresaId)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'No tienes acceso a esta empresa'
                ], 403);
            }

            // No permitir eliminarse a sí mismo
            if ($usuario->id_usuario == $usuarioId) {
                return response()->json([
                    'error' => true,
                    'mensaje' => 'No puedes eliminarte a ti mismo'
                ], 400);
            }

            // Eliminar asociación del usuario con la empresa
            DB::table('usuarios_empresas')
                ->where('id_empresa', $empresaId)
                ->where('id_usuario', $usuarioId)
                ->delete();

            return response()->json([
                'error' => false,
                'mensaje' => 'Usuario eliminado de la empresa exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'mensaje' => 'Error al eliminar usuario: ' . $e->getMessage()
            ], 500);
        }
    }
}
