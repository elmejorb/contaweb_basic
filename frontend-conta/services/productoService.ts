import api from './authService';

export interface Producto {
  id_producto: number;
  id_empresa: number;
  id_categoria?: number;
  id_impuesto?: number;
  codigo_producto: string;
  nombre_producto: string;
  descripcion_producto?: string;
  precio_compra: number;
  precio_venta: number;
  precio_venta_2?: number;
  precio_venta_3?: number;
  precio_venta_4?: number;
  precio_minimo?: number;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida?: string;
  ubicacion?: string;
  imagen_producto?: string;
  maneja_inventario: boolean;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
  categoria?: {
    id_categoria: number;
    nombre_categoria: string;
  };
  impuesto?: {
    id_impuesto: number;
    nombre_impuesto: string;
    porcentaje: number;
  };
}

export interface ProductoListResponse {
  error: boolean;
  productos: Producto[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface ProductoDiagnostico {
  id_producto: number;
  codigo: string;
  nombre: string;
  existencia: number;
  precio_costo: number;
  precio_venta: number;
  margen: number;
  unidades_vendidas: number;
  veces_vendido: number;
  capital_invertido: number;
  rotacion: 'alta' | 'media' | 'baja';
  diagnostico: string;
  tipo: 'success' | 'warning' | 'danger' | 'info' | 'ok';
}

export interface DiagnosticoResponse {
  error: boolean;
  productos: ProductoDiagnostico[];
  contadores: {
    total: number;
    alta_rotacion: number;
    rotacion_media: number;
    baja_rotacion: number;
    problemas: number;
    capital_total: number;
  };
  dias: number;
}

export const productoService = {
  /**
   * Obtener todos los productos
   */
  listar: async (params?: {
    page?: number;
    perPage?: number;
    search?: string;
    estado?: number;
    id_categoria?: number;
    id_empresa?: number;
    stock_bajo?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ProductoListResponse> => {
    try {
      const response = await api.get('/productos', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al obtener productos' };
    }
  },

  /**
   * Obtener un producto por ID
   */
  obtener: async (id: number): Promise<Producto> => {
    try {
      const response = await api.get(`/productos/${id}`);
      return response.data.producto;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al obtener producto' };
    }
  },

  /**
   * Crear un nuevo producto
   */
  crear: async (data: {
    id_empresa: number;
    id_categoria?: number;
    id_impuesto?: number;
    codigo_producto: string;
    nombre_producto: string;
    descripcion_producto?: string;
    precio_compra?: number;
    precio_venta: number;
    precio_venta_2?: number;
    precio_venta_3?: number;
    precio_venta_4?: number;
    precio_minimo?: number;
    stock_actual?: number;
    stock_minimo?: number;
    unidad_medida?: string;
    ubicacion?: string;
    imagen_producto?: string;
    maneja_inventario?: boolean;
    estado?: boolean;
  }): Promise<Producto> => {
    try {
      const response = await api.post('/productos', data);
      return response.data.producto;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al crear producto' };
    }
  },

  /**
   * Actualizar un producto
   */
  actualizar: async (id: number, data: {
    id_categoria?: number;
    id_impuesto?: number;
    codigo_producto: string;
    nombre_producto: string;
    descripcion_producto?: string;
    precio_compra?: number;
    precio_venta: number;
    precio_venta_2?: number;
    precio_venta_3?: number;
    precio_venta_4?: number;
    precio_minimo?: number;
    stock_actual?: number;
    stock_minimo?: number;
    unidad_medida?: string;
    ubicacion?: string;
    imagen_producto?: string;
    maneja_inventario?: boolean;
    estado?: boolean;
  }): Promise<Producto> => {
    try {
      const response = await api.put(`/productos/${id}`, data);
      return response.data.producto;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al actualizar producto' };
    }
  },

  /**
   * Eliminar un producto (cambiar estado a 0)
   */
  eliminar: async (id: number): Promise<void> => {
    try {
      await api.delete(`/productos/${id}`);
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al eliminar producto' };
    }
  },

  /**
   * Restaurar un producto (cambiar estado a 1)
   */
  restaurar: async (id: number): Promise<Producto> => {
    try {
      const response = await api.post(`/productos/${id}/restore`);
      return response.data.producto;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al restaurar producto' };
    }
  },

  /**
   * Buscar producto por código
   */
  buscarPorCodigo: async (codigo: string, id_empresa: number): Promise<Producto> => {
    try {
      const response = await api.post('/productos/buscar-codigo', { codigo, id_empresa });
      return response.data.producto;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al buscar producto' };
    }
  },

  /**
   * Obtener estadísticas de productos
   */
  diagnostico: async (id_empresa: number, dias?: number): Promise<DiagnosticoResponse> => {
    try {
      const response = await api.get('/productos/diagnostico', { params: { id_empresa, dias: dias || 30 } });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al obtener diagnóstico' };
    }
  },

  estadisticas: async (id_empresa: number): Promise<{
    error: boolean;
    estadisticas: {
      total_productos: number;
      total_inventario: number;
      productos_agotados: number;
      productos_stock_bajo: number;
      promedio_utilidad: number;
    };
  }> => {
    try {
      const response = await api.get('/productos/estadisticas', { params: { id_empresa } });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al obtener estadísticas' };
    }
  }
};
