import api from './authService';

export interface CierreCaja {
  id_cierre: number;
  id_empresa: number;
  id_usuario?: number;
  codvb6?: string;
  fecha: string;
  fecha_cierre?: string;
  base_inicial: number;
  base_siguiente: number;
  arqueo_billetes: number;
  arqueo_monedas: number;
  arqueo_cheques: number;
  arqueo_total: number;
  saldo_libros: number;
  diferencia: number;
  ventas_contado: number;
  ventas_credito: number;
  ventas_tarjeta: number;
  ventas_transferencia: number;
  ventas_nequi: number;
  pagos_clientes: number;
  otros_ingresos: number;
  egresos: number;
  devoluciones_ventas: number;
  devoluciones_compras: number;
  pagos_proveedores: number;
  separados: number;
  total_efectivo: number;
  total_venta_dia: number;
  valor_inventario: number;
  estado: number; // -1=Anulado, 0=Abierto, 1=Cerrado, 2=Aprobado
  aprobado_por?: number;
  fecha_aprobacion?: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
  usuario?: {
    id_usuario: number;
    nombre_us: string;
    apellido_us: string;
  };
  aprobador?: {
    id_usuario: number;
    nombre_us: string;
    apellido_us: string;
  };
}

export interface CierreCajaListResponse {
  error: boolean;
  cierres: CierreCaja[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface CierreCajaResponse {
  error: boolean;
  cierre: CierreCaja;
  mensaje?: string;
}

export interface ResumenVendedor {
  id_usuario: number;
  total_cierres: number;
  total_ventas_contado: number;
  total_ventas_credito: number;
  total_ventas_tarjeta: number;
  total_ventas_transferencia: number;
  total_ventas_nequi: number;
  total_ventas: number;
  total_diferencias: number;
  total_egresos: number;
  usuario?: {
    id_usuario: number;
    nombre_us: string;
    apellido_us: string;
  };
}

export interface ResumenVendedoresResponse {
  error: boolean;
  resumen: ResumenVendedor[];
}

export interface CierreCajaCreateUpdate {
  id_empresa: number;
  id_usuario?: number;
  fecha: string;
  base_inicial?: number;
  base_siguiente?: number;
  arqueo_billetes?: number;
  arqueo_monedas?: number;
  arqueo_cheques?: number;
  arqueo_total?: number;
  saldo_libros?: number;
  diferencia?: number;
  ventas_contado?: number;
  ventas_credito?: number;
  ventas_tarjeta?: number;
  ventas_transferencia?: number;
  ventas_nequi?: number;
  pagos_clientes?: number;
  otros_ingresos?: number;
  egresos?: number;
  devoluciones_ventas?: number;
  devoluciones_compras?: number;
  pagos_proveedores?: number;
  separados?: number;
  total_efectivo?: number;
  total_venta_dia?: number;
  valor_inventario?: number;
  observaciones?: string;
}

export interface MovimientoCaja {
  id_movimiento: number;
  id_empresa: number;
  id_usuario: number;
  id_cierre?: number;
  tipo: 'entrada' | 'salida';
  concepto: string;
  monto: number;
  referencia?: string;
  observaciones?: string;
  anulado: boolean;
  created_at?: string;
  updated_at?: string;
  usuario?: {
    id_usuario: number;
    nombre_us: string;
    apellido_us: string;
  };
  cierre?: CierreCaja;
}

export interface MovimientoCajaListResponse {
  error: boolean;
  movimientos: MovimientoCaja[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface ResumenCajaActual {
  base_inicial: number;
  total_entradas: number;
  total_salidas: number;
  saldo_actual: number;
  cantidad_movimientos: number;
}

export interface ResumenCajaResponse {
  error: boolean;
  caja_abierta: boolean;
  caja?: CierreCaja;
  resumen?: ResumenCajaActual;
  ultimos_movimientos?: MovimientoCaja[];
  mensaje?: string;
}

export interface CajaActivaResponse {
  error: boolean;
  caja_abierta: boolean;
  caja?: CierreCaja;
}

export interface CerrarCajaData {
  arqueo_billetes: number;
  arqueo_monedas: number;
  arqueo_cheques?: number;
  base_siguiente: number;
  observaciones?: string;
}

export const cierreCajaService = {
  /**
   * Listar cierres de caja
   */
  listar: async (params?: {
    page?: number;
    perPage?: number;
    id_empresa?: number;
    id_usuario?: number;
    fecha?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    estado?: number;
    origen?: 'web' | 'vb6';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<CierreCajaListResponse> => {
    try {
      const response = await api.get('/cierres-caja', { params });
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener cierres de caja',
        error: true
      };
    }
  },

  /**
   * Obtener un cierre por ID
   */
  obtener: async (id: number): Promise<CierreCaja> => {
    try {
      const response = await api.get(`/cierres-caja/${id}`);
      return response.data.cierre;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener cierre de caja',
        error: true
      };
    }
  },

  /**
   * Crear un nuevo cierre de caja
   */
  crear: async (data: CierreCajaCreateUpdate): Promise<CierreCajaResponse> => {
    try {
      const response = await api.post('/cierres-caja', data);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al crear cierre de caja',
        errores: error.response?.data?.errores || {},
        error: true
      };
    }
  },

  /**
   * Actualizar un cierre de caja
   */
  actualizar: async (id: number, data: Partial<CierreCajaCreateUpdate>): Promise<CierreCajaResponse> => {
    try {
      const response = await api.put(`/cierres-caja/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al actualizar cierre de caja',
        errores: error.response?.data?.errores || {},
        error: true
      };
    }
  },

  /**
   * Cerrar un cierre de caja
   */
  cerrar: async (id: number): Promise<CierreCajaResponse> => {
    try {
      const response = await api.post(`/cierres-caja/${id}/cerrar`);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al cerrar caja',
        error: true
      };
    }
  },

  /**
   * Aprobar un cierre de caja
   */
  aprobar: async (id: number): Promise<CierreCajaResponse> => {
    try {
      const response = await api.post(`/cierres-caja/${id}/aprobar`);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al aprobar cierre',
        error: true
      };
    }
  },

  /**
   * Obtener resumen por vendedor
   */
  resumenPorVendedor: async (params: {
    id_empresa: number;
    fecha_desde: string;
    fecha_hasta: string;
  }): Promise<ResumenVendedoresResponse> => {
    try {
      const response = await api.get('/cierres-caja/resumen-vendedores', { params });
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener resumen',
        error: true
      };
    }
  },

  /**
   * Obtener caja activa del usuario
   */
  cajaActiva: async (id_empresa: number): Promise<CajaActivaResponse> => {
    try {
      const response = await api.get('/cierres-caja/activa', { params: { id_empresa } });
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener caja activa',
        error: true
      };
    }
  },

  /**
   * Obtener resumen de caja actual
   */
  resumenCajaActual: async (id_empresa: number): Promise<ResumenCajaResponse> => {
    try {
      const response = await api.get('/cierres-caja/resumen-actual', { params: { id_empresa } });
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener resumen de caja',
        error: true
      };
    }
  },

  /**
   * Abrir una nueva caja
   */
  abrirCaja: async (data: { id_empresa: number; base_inicial: number }): Promise<CierreCajaResponse> => {
    try {
      const response = await api.post('/cierres-caja/abrir', data);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al abrir caja',
        error: true
      };
    }
  },

  /**
   * Cerrar caja con arqueo completo
   */
  cerrarCajaCompleto: async (id: number, data: CerrarCajaData): Promise<CierreCajaResponse> => {
    try {
      const response = await api.post(`/cierres-caja/${id}/cerrar-completo`, data);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al cerrar caja',
        error: true
      };
    }
  },

  // ==================== MOVIMIENTOS DE CAJA ====================

  /**
   * Listar movimientos de caja
   */
  listarMovimientos: async (params?: {
    page?: number;
    perPage?: number;
    id_empresa?: number;
    id_cierre?: number;
    tipo?: 'entrada' | 'salida';
    fecha_desde?: string;
    fecha_hasta?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<MovimientoCajaListResponse> => {
    try {
      const response = await api.get('/movimientos-caja', { params });
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al obtener movimientos',
        error: true
      };
    }
  },

  /**
   * Crear un movimiento de caja
   */
  crearMovimiento: async (data: {
    id_empresa: number;
    tipo: 'entrada' | 'salida';
    concepto: string;
    monto: number;
    referencia?: string;
    observaciones?: string;
  }): Promise<{ error: boolean; mensaje: string; movimiento: MovimientoCaja }> => {
    try {
      const response = await api.post('/movimientos-caja', data);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al crear movimiento',
        error: true
      };
    }
  },

  /**
   * Anular un movimiento de caja
   */
  anularMovimiento: async (id: number): Promise<{ error: boolean; mensaje: string; movimiento: MovimientoCaja }> => {
    try {
      const response = await api.post(`/movimientos-caja/${id}/anular`);
      return response.data;
    } catch (error: any) {
      throw {
        mensaje: error.response?.data?.mensaje || 'Error al anular movimiento',
        error: true
      };
    }
  },

  /**
   * Obtener nombre del estado
   */
  getNombreEstado: (estado: number): string => {
    const estados: { [key: number]: string } = {
      [-1]: 'Anulado',
      0: 'Abierto',
      1: 'Cerrado',
      2: 'Aprobado'
    };
    return estados[estado] || 'Desconocido';
  },

  /**
   * Obtener color del estado para badges
   */
  getColorEstado: (estado: number): string => {
    const colores: { [key: number]: string } = {
      [-1]: 'bg-gray-100 text-gray-800',
      0: 'bg-yellow-100 text-yellow-800',
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-green-100 text-green-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  }
};

export default cierreCajaService;
