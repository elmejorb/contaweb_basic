import api from './authService';

export interface Venta {
  id_venta: number;
  id_empresa: number;
  id_cliente: number;
  numero_factura: string;
  fecha_venta: string;
  subtotal: number;
  total_impuestos: number;
  descuento: number;
  total: number;
  forma_pago: string;
  t_utilidad_vent?: number;
  observaciones?: string;
  codvb6?: string;
  created_at?: string;
  updated_at?: string;
  cliente?: {
    id_cliente: number;
    nombre_razon_social: string;
    numero_documento: string;
    tipo_documento?: string;
    telefono?: string;
    celular?: string;
    whatsapp?: string;
    email?: string;
    direccion?: string;
    departamento?: string;
    municipio?: string;
    codvb6?: string;
  };
}

export interface VentaListResponse {
  error: boolean;
  ventas: Venta[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface VentaResumenResponse {
  error: boolean;
  ventas_hoy: { total: number; utilidad: number };
  ventas_mes: { total: number; contado: number; credito: number; utilidad: number; cantidad: number };
  ventas_semana: { fecha: string; total: number }[];
  ventas_mensuales: { mes: number; contado: number; credito: number; total: number; utilidad: number; total_anterior: number }[];
  anio_actual: { total: number; contado: number; credito: number; utilidad: number };
  anio_anterior: { total: number };
}

export const ventaService = {
  listar: async (params: { id_empresa: number; page?: number; perPage?: number; buscar?: string; fecha_inicio?: string; fecha_fin?: string }): Promise<VentaListResponse> => {
    const response = await api.get('/ventas', { params });
    return response.data;
  },
  resumen: async (id_empresa: number): Promise<VentaResumenResponse> => {
    const response = await api.get('/ventas/resumen', { params: { id_empresa } });
    return response.data;
  },
};
