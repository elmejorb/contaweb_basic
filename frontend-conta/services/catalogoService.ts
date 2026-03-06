import api from './authService';

export interface TipoDocumento {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface TipoResponsabilidad {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface TipoOrganizacion {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface TipoRegimen {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface CatalogosResponse {
  error: boolean;
  catalogos: {
    tipos_documentos: TipoDocumento[];
    tipos_responsabilidades: TipoResponsabilidad[];
    tipos_organizaciones: TipoOrganizacion[];
    regimenes_tributarios: TipoRegimen[];
  };
}

export const catalogoService = {
  /**
   * Obtener todos los tipos de documentos
   */
  tiposDocumentos: async (): Promise<TipoDocumento[]> => {
    try {
      const response = await api.get('/catalogos/tipos-documentos');
      return response.data.datos;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener tipos de documentos',
        error: true
      };
    }
  },

  /**
   * Obtener todos los tipos de responsabilidades
   */
  tiposResponsabilidades: async (): Promise<TipoResponsabilidad[]> => {
    try {
      const response = await api.get('/catalogos/tipos-responsabilidades');
      return response.data.datos;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener tipos de responsabilidades',
        error: true
      };
    }
  },

  /**
   * Obtener todos los tipos de organizaciones
   */
  tiposOrganizaciones: async (): Promise<TipoOrganizacion[]> => {
    try {
      const response = await api.get('/catalogos/tipos-organizaciones');
      return response.data.datos;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener tipos de organizaciones',
        error: true
      };
    }
  },

  /**
   * Obtener todos los regímenes tributarios
   */
  regimenesTributarios: async (): Promise<TipoRegimen[]> => {
    try {
      const response = await api.get('/catalogos/regimenes-tributarios');
      return response.data.datos;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener regímenes tributarios',
        error: true
      };
    }
  },

  /**
   * Obtener todos los catálogos en una sola petición
   */
  todos: async (): Promise<CatalogosResponse['catalogos']> => {
    try {
      const response = await api.get('/catalogos/todos');
      return response.data.catalogos;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener catálogos',
        error: true
      };
    }
  }
};

export default catalogoService;
