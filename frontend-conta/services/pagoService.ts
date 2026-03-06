import api from './authService';

export interface Pago {
  id_pago: number;
  id_empresa: number;
  id_pago_vb6?: number;
  rec_caja_n?: number;
  codigo_cliente?: string;
  factura_n?: number;
  valor_pago: number;
  fecha?: string;
  detalle_pago?: string;
  valor_factura: number;
  saldo_actual: number;
  descuento?: number;
  retencion?: number;
  iva_retenido?: number;
  estado?: string;
  saldo_total?: number;
  cedula?: string;
  recibido_de?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PagoListResponse {
  error: boolean;
  pagos: Pago[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export const pagoService = {
  listar: async (params: { id_empresa: number; page?: number; perPage?: number; buscar?: string; factura_n?: number; fecha_inicio?: string; fecha_fin?: string }): Promise<PagoListResponse> => {
    const response = await api.get('/pagos', { params });
    return response.data;
  },
};
