import api from './authService';

export interface Cliente {
  id_cliente: number;
  id_empresa: number;
  codigo_cliente?: string;
  nombre_razon_social: string;
  tipo_documento: string;
  numero_documento: string;
  digito_verificacion?: string;
  telefono?: string;
  celular?: string;
  whatsapp?: string;
  email?: string;
  direccion?: string;
  departamento?: string;
  municipio?: string;
  fecha_nacimiento?: string;
  tipo_responsabilidad?: string;
  tipo_adquiriente?: string;
  regimen_tributario?: string;
  contacto_nombres?: string;
  contacto_apellidos?: string;
  contacto_telefono?: string;
  contacto_direccion?: string;
  cupo_autorizado: number;
  id_vendedor?: number;
  factura_precio_costo: boolean;
  facturar_con_vencimientos: boolean;
  facturar_solo_contado: boolean;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
  vendedor?: {
    id_usuario: number;
    nombre: string;
  };
}

export interface ClienteListResponse {
  error: boolean;
  clientes: Cliente[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface ClienteResponse {
  error: boolean;
  cliente: Cliente;
  mensaje?: string;
}

export interface ClienteCreateUpdate {
  id_empresa: number;
  nombre_razon_social: string;
  tipo_documento: string;
  numero_documento: string;
  digito_verificacion?: string;
  telefono?: string;
  celular?: string;
  whatsapp?: string;
  email?: string;
  direccion?: string;
  departamento?: string;
  municipio?: string;
  fecha_nacimiento?: string;
  tipo_responsabilidad?: string;
  tipo_adquiriente?: string;
  regimen_tributario?: string;
  contacto_nombres?: string;
  contacto_apellidos?: string;
  contacto_telefono?: string;
  contacto_direccion?: string;
  cupo_autorizado?: number;
  id_vendedor?: number;
  factura_precio_costo?: boolean;
  facturar_con_vencimientos?: boolean;
  facturar_solo_contado?: boolean;
  estado?: boolean;
}

export const clienteService = {
  /**
   * Listar todos los clientes
   */
  listar: async (params?: {
    page?: number;
    perPage?: number;
    search?: string;
    estado?: number;
    id_empresa?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ClienteListResponse> => {
    try {
      const response = await api.get('/clientes', { params });
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener clientes',
        error: true
      };
    }
  },

  /**
   * Obtener un cliente por ID
   */
  obtener: async (id: number): Promise<Cliente> => {
    try {
      const response = await api.get(`/clientes/${id}`);
      return response.data.cliente;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener cliente',
        error: true
      };
    }
  },

  /**
   * Crear un nuevo cliente
   */
  crear: async (data: ClienteCreateUpdate): Promise<ClienteResponse> => {
    try {
      const response = await api.post('/clientes', data);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al crear cliente',
        errores: error.response?.data?.errores || {},
        error: true
      };
    }
  },

  /**
   * Actualizar un cliente existente
   */
  actualizar: async (id: number, data: ClienteCreateUpdate): Promise<ClienteResponse> => {
    try {
      const response = await api.put(`/clientes/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al actualizar cliente',
        errores: error.response?.data?.errores || {},
        error: true
      };
    }
  },

  /**
   * Eliminar (desactivar) un cliente
   */
  eliminar: async (id: number): Promise<{ error: boolean; mensaje: string }> => {
    try {
      const response = await api.delete(`/clientes/${id}`);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al eliminar cliente',
        error: true
      };
    }
  }
};

export default clienteService;
