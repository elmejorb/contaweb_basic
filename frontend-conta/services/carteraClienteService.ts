import api from './authService';

export interface SaldoCartera {
  id_saldo_cartera: number;
  id_empresa: number;
  codigo_tercero: string;
  nombre_tercero: string;
  tipo: 'cliente' | 'proveedor';
  saldo_total: number;
  created_at?: string;
  updated_at?: string;
}

export interface ResumenCartera {
  clientes: {
    cantidad: number;
    total_por_cobrar: number;
  };
  proveedores: {
    cantidad: number;
    total_por_pagar: number;
  };
}

export const carteraClienteService = {
  // Listar saldos de cartera de clientes
  listarClientes: async (id_empresa: number): Promise<{ error: boolean; saldos: SaldoCartera[] }> => {
    const response = await api.get('/cartera/clientes', { params: { id_empresa } });
    return response.data;
  },

  // Listar saldos de cartera de proveedores
  listarProveedores: async (id_empresa: number): Promise<{ error: boolean; saldos: SaldoCartera[] }> => {
    const response = await api.get('/cartera/proveedores', { params: { id_empresa } });
    return response.data;
  },

  // Obtener resumen de cartera (clientes y proveedores)
  resumen: async (id_empresa: number): Promise<{ error: boolean; resumen: ResumenCartera }> => {
    const response = await api.get('/cartera/resumen', { params: { id_empresa } });
    return response.data;
  },

  // Eliminar un registro de cartera
  eliminar: async (id: number, id_empresa: number): Promise<{ error: boolean; mensaje: string }> => {
    const response = await api.delete(`/cartera/${id}`, { params: { id_empresa } });
    return response.data;
  },
};

export default carteraClienteService;
