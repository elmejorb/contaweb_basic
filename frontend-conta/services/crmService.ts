import axios from 'axios';

// Crear instancia de axios sin interceptores de autenticación
const crmApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Agregar token solo si existe (para endpoints que requieren autenticación)
crmApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface ClienteCRM {
  id: number;
  empresa: string;
  nit: string;
  propietario: string;
  email: string;
  telefono: string;
  acceso_web_activo: boolean;
}

export interface SuscripcionCRM {
  plan: string;
  fecha_vencimiento: string;
  dias_restantes: number;
  estado: 'activo' | 'inactivo' | 'vencido' | 'suspendido';
}

export interface ValidacionTokenResponse {
  error: boolean;
  mensaje?: string;
  cliente?: ClienteCRM;
  suscripcion?: SuscripcionCRM;
  modulos_habilitados?: string[];
}

export interface EmpresaConPlan {
  id_empresa: number;
  nombre_empresa: string;
  nit_empresa: string;
  telefono_empresa?: string;
  direccion_empresa?: string;
  email_empresa?: string;
  plan_actual?: string;
  fecha_vencimiento_plan?: string;
  estado_suscripcion?: string;
  modulos_habilitados?: string[];
}

export const crmService = {
  /**
   * Validar token del CRM antes de crear una empresa
   */
  validarToken: async (token_crm: string): Promise<ValidacionTokenResponse> => {
    try {
      const response = await crmApi.post('/crm/validar-token', { token_crm });
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al validar token',
        error: true
      };
    }
  },

  /**
   * Crear empresa con validación de CRM
   */
  crearEmpresaConCRM: async (data: {
    token_crm: string;
    nombre_empresa: string;
    nit_empresa: string;
    telefono_empresa?: string;
    direccion_empresa?: string;
    email_empresa?: string;
  }): Promise<{ error: boolean; mensaje: string; empresa: EmpresaConPlan }> => {
    try {
      const response = await crmApi.post('/empresas/crear-con-crm', data);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al crear empresa',
        errores: error.response?.data?.errores || {},
        error: true
      };
    }
  },

  /**
   * Actualizar plan desde el CRM
   */
  actualizarPlan: async (id_empresa: number): Promise<{ error: boolean; mensaje: string; empresa: EmpresaConPlan }> => {
    try {
      const response = await crmApi.post(`/empresas/${id_empresa}/actualizar-plan`);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al actualizar plan',
        error: true
      };
    }
  },

  /**
   * Verificar acceso a un módulo específico
   */
  verificarAccesoModulo: async (
    id_empresa: number,
    modulo: string
  ): Promise<{ error: boolean; tiene_acceso: boolean; modulo: string }> => {
    try {
      const response = await crmApi.post(`/empresas/${id_empresa}/verificar-modulo`, { modulo });
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al verificar acceso',
        error: true
      };
    }
  },

  /**
   * Obtener nombre legible del módulo
   */
  getNombreModulo: (modulo: string): string => {
    const nombres: { [key: string]: string } = {
      'facturas': 'Facturación',
      'clientes': 'Clientes',
      'proveedores': 'Proveedores',
      'inventario': 'Inventario',
      'caja': 'Caja',
      'contabilidad': 'Contabilidad',
      'nomina': 'Nómina',
      'reportes_basicos': 'Reportes Básicos',
      'reportes_avanzados': 'Reportes Avanzados',
      'reportes_personalizados': 'Reportes Personalizados',
      'multi_usuario': 'Multi Usuario',
      'multi_empresa': 'Multi Empresa',
      'sincronizacion_vb6': 'Sincronización VB6',
      'api_integraciones': 'API e Integraciones',
      'soporte_prioritario': 'Soporte Prioritario'
    };
    return nombres[modulo] || modulo;
  },

  /**
   * Obtener color para el estado de suscripción
   */
  getColorEstado: (estado: string): string => {
    const colores: { [key: string]: string } = {
      'activo': 'bg-green-100 text-green-800',
      'inactivo': 'bg-gray-100 text-gray-800',
      'vencido': 'bg-red-100 text-red-800',
      'suspendido': 'bg-yellow-100 text-yellow-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  }
};

export default crmService;
