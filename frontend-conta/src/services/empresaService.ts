import api from '../../services/authService';

export interface Empresa {
  id_empresa: number;
  nombre_empresa: string;
  nit_empresa: string;
  telefono_empresa?: string;
  direccion_empresa?: string;
  email_empresa?: string;
  logo_empresa?: string;
  codigo_empresa?: string;
  descripcion_empresa?: string;
  regimen_empresa?: 'Simplificado' | 'Comun';
  resolucion_facturacion?: string;
  fecha_resolucion?: string;
  prefijo_factura?: string;
  rango_desde?: number;
  rango_hasta?: number;
  token_crm?: string;
  id_cliente_crm?: number;
  plan_actual?: string;
  fecha_vencimiento_plan?: string;
  estado_suscripcion?: string;
  modulos_habilitados?: string[];
  ultima_validacion_crm?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SincronizacionCRMResponse {
  error: boolean;
  mensaje: string;
  empresa: {
    id_empresa: number;
    nombre_empresa: string;
    nit_empresa: string;
    plan_actual: string;
    fecha_vencimiento_plan: string;
    estado_suscripcion: string;
    modulos_habilitados: string[];
    ultima_validacion_crm: string;
    dias_restantes?: number;
  };
}

export interface EmpresaConToken extends Empresa {
  token_api: string;
}

export interface CrearEmpresaData {
  nombre_empresa: string;
  nit_empresa: string;
  telefono_empresa?: string;
  direccion_empresa?: string;
  email_empresa?: string;
  descripcion_empresa?: string;
  regimen_empresa?: 'Simplificado' | 'Comun';
  resolucion_facturacion?: string;
  fecha_resolucion?: string;
  prefijo_factura?: string;
  rango_desde?: number;
  rango_hasta?: number;
}

export const empresaService = {
  /**
   * Obtener empresas del usuario autenticado
   */
  misEmpresas: async (): Promise<Empresa[]> => {
    const response = await api.get('/empresas/mis-empresas');
    return response.data.empresas;
  },

  /**
   * Obtener una empresa específica
   */
  obtener: async (id: number, showToken: boolean = false): Promise<Empresa> => {
    const params = showToken ? { show_token: true } : {};
    const response = await api.get(`/empresas/${id}`, { params });
    return response.data.empresa;
  },

  /**
   * Crear nueva empresa
   */
  crear: async (data: CrearEmpresaData): Promise<Empresa> => {
    const response = await api.post('/empresas', data);
    return response.data.empresa;
  },

  /**
   * Actualizar empresa
   */
  actualizar: async (id: number, data: Partial<CrearEmpresaData>): Promise<Empresa> => {
    const response = await api.put(`/empresas/${id}`, data);
    return response.data.empresa;
  },

  /**
   * Regenerar token API
   */
  regenerarToken: async (id: number): Promise<string> => {
    const response = await api.post(`/empresas/${id}/regenerar-token`);
    return response.data.token_api;
  },

  /**
   * Obtener token API de una empresa
   */
  obtenerToken: async (id: number): Promise<{ token_api: string; codigo_empresa: string }> => {
    const response = await api.get(`/empresas/${id}/token`);
    return {
      token_api: response.data.token_api,
      codigo_empresa: response.data.codigo_empresa
    };
  },

  /**
   * Subir logo de empresa
   */
  subirLogo: async (id: number, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.post(`/empresas/${id}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.logo_url;
  },

  /**
   * Eliminar logo de empresa
   */
  eliminarLogo: async (id: number): Promise<void> => {
    await api.delete(`/empresas/${id}/logo`);
  },

  /**
   * Sincronizar empresa con CRM
   */
  sincronizarConCRM: async (id: number): Promise<SincronizacionCRMResponse> => {
    const response = await api.post(`/empresas/${id}/sincronizar-crm`);
    return response.data;
  }
};
