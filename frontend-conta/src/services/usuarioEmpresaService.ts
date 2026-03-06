import api from './api';

export interface Usuario {
  id_usuario: number;
  nombre_us: string;
  email_us: string;
  avatar?: string;
  tipo_usuario?: {
    id_tipo_usuario: number;
    nombre_tipo: string;
  };
  id_tipo_usuario: number;
  estado_us: number;
  email_validado: string;
  created_at?: string;
  updated_at?: string;
}

export interface TipoUsuario {
  id_tipo_usuario: number;
  nombre_tipo: string;
}

export interface CrearUsuarioData {
  nombre_us: string;
  email_us: string;
  password: string;
  id_tipo_usuario: number;
}

export interface ActualizarUsuarioData {
  nombre_us?: string;
  email_us?: string;
  password?: string;
  id_tipo_usuario?: number;
}

export const usuarioEmpresaService = {
  /**
   * Obtener usuarios de una empresa
   */
  listar: async (empresaId: number): Promise<Usuario[]> => {
    const response = await api.get(`/empresas/${empresaId}/usuarios`);
    return response.data.usuarios;
  },

  /**
   * Crear nuevo usuario para una empresa
   */
  crear: async (empresaId: number, data: CrearUsuarioData): Promise<Usuario> => {
    const response = await api.post(`/empresas/${empresaId}/usuarios`, data);
    return response.data.usuario;
  },

  /**
   * Actualizar usuario de una empresa
   */
  actualizar: async (empresaId: number, usuarioId: number, data: ActualizarUsuarioData): Promise<Usuario> => {
    const response = await api.put(`/empresas/${empresaId}/usuarios/${usuarioId}`, data);
    return response.data.usuario;
  },

  /**
   * Cambiar estado de usuario (activar/desactivar)
   */
  cambiarEstado: async (empresaId: number, usuarioId: number): Promise<number> => {
    const response = await api.post(`/empresas/${empresaId}/usuarios/${usuarioId}/estado`);
    return response.data.estado_us;
  },

  /**
   * Eliminar usuario de una empresa
   */
  eliminar: async (empresaId: number, usuarioId: number): Promise<void> => {
    await api.delete(`/empresas/${empresaId}/usuarios/${usuarioId}`);
  },

  /**
   * Obtener tipos de usuario disponibles
   */
  getTiposUsuario: async (): Promise<TipoUsuario[]> => {
    const response = await api.get('/tipos-usuario');
    return response.data.tipos_usuario;
  }
};
