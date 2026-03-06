import api from './authService';

export interface Proveedor {
  id_proveedor: number;
  id_empresa: number;
  codigo_proveedor?: string;
  razon_social: string;
  nit: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  contacto_nombres?: string;
  contacto_apellidos?: string;
  contacto_identificacion?: string;
  contacto_telefono?: string;
  contacto_direccion?: string;
  numero_cuentas_banco?: string;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProveedorListResponse {
  error: boolean;
  proveedores: Proveedor[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface ProveedorResponse {
  error: boolean;
  proveedor: Proveedor;
  mensaje?: string;
}

export interface ProveedorCreateUpdate {
  id_empresa: number;
  razon_social: string;
  nit: string;
  telefono?: string;
  direccion?: string;
  contacto_nombres?: string;
  contacto_apellidos?: string;
  contacto_identificacion?: string;
  contacto_telefono?: string;
  contacto_direccion?: string;
  numero_cuentas_banco?: string;
  estado?: boolean;
}

export const proveedorService = {
  /**
   * Listar todos los proveedores
   */
  listar: async (params?: {
    page?: number;
    perPage?: number;
    search?: string;
    estado?: number;
    id_empresa?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ProveedorListResponse> => {
    try {
      const response = await api.get('/proveedores', { params });
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener proveedores',
        error: true
      };
    }
  },

  /**
   * Obtener un proveedor por ID
   */
  obtener: async (id: number): Promise<Proveedor> => {
    try {
      const response = await api.get(`/proveedores/${id}`);
      return response.data.proveedor;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener proveedor',
        error: true
      };
    }
  },

  /**
   * Crear un nuevo proveedor
   */
  crear: async (data: ProveedorCreateUpdate): Promise<ProveedorResponse> => {
    try {
      const response = await api.post('/proveedores', data);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al crear proveedor',
        errores: error.response?.data?.errores || {},
        error: true
      };
    }
  },

  /**
   * Actualizar un proveedor existente
   */
  actualizar: async (id: number, data: ProveedorCreateUpdate): Promise<ProveedorResponse> => {
    try {
      const response = await api.put(`/proveedores/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al actualizar proveedor',
        errores: error.response?.data?.errores || {},
        error: true
      };
    }
  },

  /**
   * Eliminar (desactivar) un proveedor
   */
  eliminar: async (id: number): Promise<{ error: boolean; mensaje: string }> => {
    try {
      const response = await api.delete(`/proveedores/${id}`);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al eliminar proveedor',
        error: true
      };
    }
  }
};

export default proveedorService;
