import api from './authService';

export interface Impuesto {
  id_impuesto: number;
  nombre_impuesto: string;
  porcentaje: number;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ImpuestoListResponse {
  error: boolean;
  impuestos: Impuesto[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface ImpuestoResponse {
  error: boolean;
  impuesto: Impuesto;
  mensaje?: string;
}

export interface ImpuestoCreateUpdate {
  nombre_impuesto: string;
  porcentaje: number;
  estado: boolean;
}

interface ListarParams {
  search?: string;
  estado?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

class ImpuestoService {
  /**
   * Listar impuestos con filtros opcionales
   */
  async listar(params: ListarParams = {}): Promise<ImpuestoListResponse> {
    try {
      const response = await api.get('/impuestos', { params });
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener impuestos',
        error: true
      };
    }
  }

  /**
   * Obtener un impuesto por ID
   */
  async obtener(id: number): Promise<Impuesto> {
    try {
      const response = await api.get(`/impuestos/${id}`);
      return response.data.impuesto;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener impuesto',
        error: true
      };
    }
  }

  /**
   * Crear un nuevo impuesto
   */
  async crear(data: ImpuestoCreateUpdate): Promise<ImpuestoResponse> {
    try {
      const response = await api.post('/impuestos', data);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al crear impuesto',
        errores: error.response?.data?.errores || {},
        error: true
      };
    }
  }

  /**
   * Actualizar un impuesto existente
   */
  async actualizar(id: number, data: ImpuestoCreateUpdate): Promise<ImpuestoResponse> {
    try {
      const response = await api.put(`/impuestos/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al actualizar impuesto',
        errores: error.response?.data?.errores || {},
        error: true
      };
    }
  }

  /**
   * Eliminar (desactivar) un impuesto
   */
  async eliminar(id: number): Promise<{ error: boolean; mensaje: string }> {
    try {
      const response = await api.delete(`/impuestos/${id}`);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al eliminar impuesto',
        error: true
      };
    }
  }

  /**
   * Restaurar un impuesto desactivado
   */
  async restaurar(id: number): Promise<ImpuestoResponse> {
    try {
      const response = await api.post(`/impuestos/${id}/restore`);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al restaurar impuesto',
        error: true
      };
    }
  }
}

export default new ImpuestoService();
