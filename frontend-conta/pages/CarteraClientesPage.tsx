import React, { useState, useEffect } from 'react';
import { carteraClienteService, SaldoCartera } from '../services/carteraClienteService';

interface PageProps {
  setActivePage: (page: string) => void;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const CarteraClientesPage: React.FC<PageProps> = ({ setActivePage }) => {
  const [loading, setLoading] = useState(true);
  const [saldos, setSaldos] = useState<SaldoCartera[]>([]);
  const [totalCuentasPorCobrar, setTotalCuentasPorCobrar] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSaldo, setFiltroSaldo] = useState<'todos' | 'con_saldo'>('con_saldo');

  const cargarSaldos = async () => {
    setLoading(true);
    try {
      const empresaActivaId = localStorage.getItem('empresa_activa_id');
      if (!empresaActivaId) {
        console.error('No hay empresa activa');
        setSaldos([]);
        setLoading(false);
        return;
      }
      const response = await carteraClienteService.listarClientes(Number(empresaActivaId));
      if (!response.error) {
        const saldosData = response.saldos || [];
        setSaldos(saldosData);
        // Calcular total
        const total = saldosData.reduce((acc, item) => acc + Number(item.saldo_total || 0), 0);
        setTotalCuentasPorCobrar(total);
      }
    } catch (error) {
      console.error('Error al cargar cartera de clientes:', error);
      setSaldos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSaldos();
  }, []);

  // Filtrar saldos
  const saldosFiltrados = saldos.filter(item => {
    const nombre = item.nombre_tercero || '';
    const codigo = item.codigo_tercero || '';
    const matchSearch =
      nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      codigo.includes(searchTerm);

    const saldoNum = Number(item.saldo_total || 0);
    const matchSaldo =
      filtroSaldo === 'todos' ||
      (filtroSaldo === 'con_saldo' && saldoNum > 0);

    return matchSearch && matchSaldo;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cartera de Clientes</h1>
          <p className="text-gray-500">Cuentas por cobrar</p>
        </div>
        <div className="bg-violet-100 px-4 py-2 rounded-lg">
          <p className="text-sm text-violet-600">Total Cuentas por Cobrar</p>
          <p className="text-xl font-bold text-violet-700">{formatCurrency(totalCuentasPorCobrar)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre o codigo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroSaldo('con_saldo')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroSaldo === 'con_saldo'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Con saldo
            </button>
            <button
              onClick={() => setFiltroSaldo('todos')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroSaldo === 'todos'
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={cargarSaldos}
              className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de cartera */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          </div>
        ) : saldosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No hay cuentas por cobrar</p>
            <p className="text-sm">Los clientes con saldo pendiente apareceran aqui</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Codigo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {saldosFiltrados.map((item) => (
                  <tr key={item.id_saldo_cartera} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.codigo_tercero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.nombre_tercero}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`font-bold ${Number(item.saldo_total) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(Number(item.saldo_total))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-right font-bold text-gray-700">
                    Total ({saldosFiltrados.length} clientes):
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">
                    {formatCurrency(saldosFiltrados.reduce((acc, item) => acc + Number(item.saldo_total || 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarteraClientesPage;
