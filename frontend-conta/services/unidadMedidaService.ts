import api from './authService';

export interface UnidadMedida {
  id: number;
  name: string;
  code: string;
}

export interface UnidadMedidaListResponse {
  error: boolean;
  unidades: UnidadMedida[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

interface ListarParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

class UnidadMedidaService {
  /**
   * Listar unidades de medida con filtros opcionales
   */
  async listar(params: ListarParams = {}): Promise<UnidadMedidaListResponse> {
    try {
      const response = await api.get('/unidades-medida', { params });
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener unidades de medida',
        error: true
      };
    }
  }

  /**
   * Obtener todas las unidades de medida (sin paginación)
   * Útil para selects y dropdowns
   */
  async todas(): Promise<UnidadMedida[]> {
    try {
      const response = await api.get('/unidades-medida/todas');
      return response.data.unidades;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener unidades de medida',
        error: true
      };
    }
  }

  /**
   * Obtener una unidad de medida por ID
   */
  async obtener(id: number): Promise<UnidadMedida> {
    try {
      const response = await api.get(`/unidades-medida/${id}`);
      return response.data.unidad;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener unidad de medida',
        error: true
      };
    }
  }

  /**
   * Buscar unidad de medida por código
   */
  async buscarPorCodigo(codigo: string): Promise<UnidadMedida> {
    try {
      const response = await api.get(`/unidades-medida/codigo/${codigo}`);
      return response.data.unidad;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al buscar unidad de medida',
        error: true
      };
    }
  }
}

export default new UnidadMedidaService();
