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

export interface ReporteMensualResponse {
  error: boolean;
  anio: number;
  mes: number;
  ventas_por_dia: { fecha: string; cantidad: number; total: number; contado: number; credito: number; utilidad: number }[];
  total_mes: { cantidad: number; total: number; contado: number; credito: number; utilidad: number; impuestos: number; descuentos: number };
  mes_anterior: { cantidad: number; total: number; utilidad: number };
  top_clientes: { cliente: string; cantidad_ventas: number; total: number }[];
  por_forma_pago: { forma_pago: string; cantidad: number; total: number }[];
}

export interface RankingClienteItem {
  id_cliente: number;
  nombre: string;
  documento: string;
  cantidad_ventas: number;
  total_compras: number;
  utilidad_generada: number;
  ticket_promedio: number;
  ultima_compra: string;
  dias_sin_comprar: number;
  total_contado: number;
  total_credito: number;
}

export interface ClienteInactivo {
  id_cliente: number;
  nombre: string;
  documento: string;
  ultima_compra: string;
  dias_sin_comprar: number;
  total_historico: number;
}

export interface RankingClientesResponse {
  error: boolean;
  top_clientes: RankingClienteItem[];
  clientes_inactivos: ClienteInactivo[];
  resumen: {
    total_clientes_activos: number;
    total_clientes_inactivos: number;
    total_ventas_periodo: number;
    total_monto_periodo: number;
    ticket_promedio_general: number;
  };
  dias: number;
}

export interface ComparativoPeriodo {
  cantidad: number;
  total: number;
  utilidad: number;
  contado: number;
  credito: number;
}

export interface ComparativoMensual {
  mes: number;
  mes_nombre: string;
  total_actual: number;
  total_anterior: number;
  utilidad_actual: number;
  cantidad_actual: number;
}

export interface VentaPorDiaSemana {
  dia_num: number;
  dia: string;
  cantidad: number;
  total: number;
  promedio_diario: number;
}

export interface ComparativoResponse {
  error: boolean;
  mes_actual: ComparativoPeriodo;
  mes_anterior: ComparativoPeriodo;
  mismo_mes_anio_anterior: ComparativoPeriodo;
  anio_actual: ComparativoPeriodo;
  anio_anterior: ComparativoPeriodo;
  mensuales: ComparativoMensual[];
  por_dia_semana: VentaPorDiaSemana[];
  por_forma_pago: { forma_pago: string; cantidad: number; total: number }[];
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
  reporteMensual: async (params: { id_empresa: number; anio: number; mes: number }): Promise<ReporteMensualResponse> => {
    const response = await api.get('/ventas/reporte-mensual', { params });
    return response.data;
  },
  rankingClientes: async (params: { id_empresa: number; dias?: number }): Promise<RankingClientesResponse> => {
    const response = await api.get('/ventas/ranking-clientes', { params });
    return response.data;
  },
  comparativo: async (params: { id_empresa: number; anio: number; mes: number }): Promise<ComparativoResponse> => {
    const response = await api.get('/ventas/comparativo', { params });
    return response.data;
  },
};
