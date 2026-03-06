import api from './authService';

export interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
  descripcion_categoria?: string;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriaListResponse {
  error: boolean;
  categorias: Categoria[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export const categoriaService = {
  /**
   * Obtener todas las categorías
   */
  listar: async (params?: {
    page?: number;
    perPage?: number;
    search?: string;
    estado?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    id_empresa?: number;
  }): Promise<CategoriaListResponse> => {
    try {
      // Si no se proporciona id_empresa, obtenerlo del localStorage
      const finalParams = { ...params };
      if (!finalParams.id_empresa) {
        const empresaActivaId = localStorage.getItem('empresa_activa_id');
        if (empresaActivaId) {
          finalParams.id_empresa = parseInt(empresaActivaId);
        }
      }

      const response = await api.get('/categorias', { params: finalParams });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al obtener categorías' };
    }
  },

  /**
   * Obtener una categoría por ID
   */
  obtener: async (id: number): Promise<Categoria> => {
    try {
      const response = await api.get(`/categorias/${id}`);
      return response.data.categoria;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al obtener categoría' };
    }
  },

  /**
   * Crear una nueva categoría
   */
  crear: async (data: {
    nombre_categoria: string;
    descripcion_categoria?: string;
    estado?: boolean;
    id_empresa?: number;
  }): Promise<Categoria> => {
    try {
      // Si no se proporciona id_empresa, obtenerlo del localStorage
      const finalData = { ...data };
      if (!finalData.id_empresa) {
        const empresaActivaId = localStorage.getItem('empresa_activa_id');
        if (empresaActivaId) {
          finalData.id_empresa = parseInt(empresaActivaId);
        }
      }

      const response = await api.post('/categorias', finalData);
      return response.data.categoria;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al crear categoría' };
    }
  },

  /**
   * Actualizar una categoría
   */
  actualizar: async (id: number, data: {
    nombre_categoria: string;
    descripcion_categoria?: string;
    estado?: boolean;
  }): Promise<Categoria> => {
    try {
      const response = await api.put(`/categorias/${id}`, data);
      return response.data.categoria;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al actualizar categoría' };
    }
  },

  /**
   * Eliminar una categoría (cambiar estado a 0)
   */
  eliminar: async (id: number): Promise<void> => {
    try {
      await api.delete(`/categorias/${id}`);
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al eliminar categoría' };
    }
  },

  /**
   * Restaurar una categoría (cambiar estado a 1)
   */
  restaurar: async (id: number): Promise<Categoria> => {
    try {
      const response = await api.post(`/categorias/${id}/restore`);
      return response.data.categoria;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al restaurar categoría' };
    }
  }
};
