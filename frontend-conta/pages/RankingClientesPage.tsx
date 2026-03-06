import React, { useState, useEffect, useMemo } from 'react';
import { ventaService, RankingClienteItem, ClienteInactivo, RankingClientesResponse } from '../services/ventaService';

interface PageProps {
  setActivePage: (page: string) => void;
}

type SortField = 'total_compras' | 'cantidad_ventas' | 'utilidad_generada' | 'ticket_promedio' | 'dias_sin_comprar';
type TabActiva = 'top' | 'inactivos';

const formatMoney = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const RankingClientesPage: React.FC<PageProps> = () => {
  const [data, setData] = useState<RankingClientesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dias, setDias] = useState(90);
  const [sortField, setSortField] = useState<SortField>('total_compras');
  const [sortAsc, setSortAsc] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [tab, setTab] = useState<TabActiva>('top');

  const empresaId = Number(localStorage.getItem('empresa_activa_id'));

  const cargar = async () => {
    if (!empresaId) return;
    setLoading(true);
    setError('');
    try {
      const res = await ventaService.rankingClientes({ id_empresa: empresaId, dias });
      setData(res);
    } catch (e: any) {
      setError(e.response?.data?.mensaje || 'Error al cargar ranking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [dias]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-xs">{sortField === field ? (sortAsc ? '▲' : '▼') : '↕'}</span>
  );

  const topClientesFiltrados = useMemo(() => {
    if (!data) return [];
    let items = [...data.top_clientes];
    if (buscar) {
      const b = buscar.toLowerCase();
      items = items.filter(c => c.nombre.toLowerCase().includes(b) || c.documento.includes(b));
    }
    items.sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      return sortAsc ? va - vb : vb - va;
    });
    return items;
  }, [data, buscar, sortField, sortAsc]);

  const inactivosFiltrados = useMemo(() => {
    if (!data) return [];
    let items = [...data.clientes_inactivos];
    if (buscar) {
      const b = buscar.toLowerCase();
      items = items.filter(c => c.nombre.toLowerCase().includes(b) || c.documento.includes(b));
    }
    return items;
  }, [data, buscar]);

  const exportarCSV = () => {
    if (!data) return;
    const rows = tab === 'top' ? topClientesFiltrados : inactivosFiltrados;
    const BOM = '\uFEFF';
    let csv = BOM;

    if (tab === 'top') {
      csv += 'Pos;Cliente;Documento;Ventas;Total Compras;Utilidad;Ticket Prom;Contado;Credito;Dias sin comprar\n';
      rows.forEach((c, i) => {
        const r = c as RankingClienteItem;
        csv += `${i + 1};${r.nombre};${r.documento};${r.cantidad_ventas};${r.total_compras};${r.utilidad_generada};${r.ticket_promedio};${r.total_contado};${r.total_credito};${r.dias_sin_comprar}\n`;
      });
    } else {
      csv += 'Cliente;Documento;Ultima Compra;Dias sin comprar;Total Historico\n';
      rows.forEach(c => {
        const r = c as ClienteInactivo;
        csv += `${r.nombre};${r.documento};${r.ultima_compra};${r.dias_sin_comprar};${r.total_historico}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking_clientes_${dias}d_${tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button onClick={cargar} className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Reintentar</button>
      </div>
    );
  }

  if (!data) return null;

  const { resumen } = data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Ranking de Clientes</h1>
        <div className="flex items-center gap-2">
          <select value={dias} onChange={e => setDias(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
            <option value={30}>30 dias</option>
            <option value={60}>60 dias</option>
            <option value={90}>90 dias</option>
            <option value={180}>180 dias</option>
            <option value={365}>1 ano</option>
          </select>
          <button onClick={exportarCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase">Clientes Activos</p>
          <p className="text-2xl font-bold text-violet-600">{resumen.total_clientes_activos}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase">Clientes Inactivos</p>
          <p className="text-2xl font-bold text-orange-500">{resumen.total_clientes_inactivos}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase">Ventas Periodo</p>
          <p className="text-2xl font-bold text-blue-600">{resumen.total_ventas_periodo}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase">Total Periodo</p>
          <p className="text-xl font-bold text-green-600">{formatMoney(resumen.total_monto_periodo)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase">Ticket Promedio</p>
          <p className="text-xl font-bold text-gray-700">{formatMoney(resumen.ticket_promedio_general)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-200 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('top')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'top' ? 'bg-white shadow text-violet-700' : 'text-gray-600 hover:text-gray-800'}`}>
          Top Clientes ({data.top_clientes.length})
        </button>
        <button onClick={() => setTab('inactivos')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'inactivos' ? 'bg-white shadow text-orange-600' : 'text-gray-600 hover:text-gray-800'}`}>
          Inactivos ({data.clientes_inactivos.length})
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar por nombre o documento..."
        value={buscar}
        onChange={e => setBuscar(e.target.value)}
        className="w-full sm:w-80 border rounded-lg px-3 py-2 text-sm"
      />

      {/* Table Top Clientes */}
      {tab === 'top' && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">#</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Cliente</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 cursor-pointer select-none" onClick={() => handleSort('cantidad_ventas')}>
                  Ventas <SortIcon field="cantidad_ventas" />
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 cursor-pointer select-none" onClick={() => handleSort('total_compras')}>
                  Total Compras <SortIcon field="total_compras" />
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 cursor-pointer select-none" onClick={() => handleSort('utilidad_generada')}>
                  Utilidad <SortIcon field="utilidad_generada" />
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 cursor-pointer select-none" onClick={() => handleSort('ticket_promedio')}>
                  Ticket Prom. <SortIcon field="ticket_promedio" />
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500">Contado</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500">Credito</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 cursor-pointer select-none" onClick={() => handleSort('dias_sin_comprar')}>
                  Dias s/c <SortIcon field="dias_sin_comprar" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topClientesFiltrados.map((c, i) => (
                <tr key={c.id_cliente} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-800">{c.nombre}</div>
                    <div className="text-xs text-gray-400">{c.documento}</div>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{c.cantidad_ventas}</td>
                  <td className="px-3 py-2 text-right font-bold text-green-700">{formatMoney(c.total_compras)}</td>
                  <td className="px-3 py-2 text-right text-blue-600">{formatMoney(c.utilidad_generada)}</td>
                  <td className="px-3 py-2 text-right">{formatMoney(c.ticket_promedio)}</td>
                  <td className="px-3 py-2 text-right text-green-600">{formatMoney(c.total_contado)}</td>
                  <td className="px-3 py-2 text-right text-orange-600">{formatMoney(c.total_credito)}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.dias_sin_comprar <= 15 ? 'bg-green-100 text-green-700' : c.dias_sin_comprar <= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {c.dias_sin_comprar}d
                    </span>
                  </td>
                </tr>
              ))}
              {topClientesFiltrados.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">No se encontraron clientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Inactivos */}
      {tab === 'inactivos' && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <div className="p-4 border-b bg-orange-50">
            <p className="text-sm text-orange-700">Clientes que compraron antes del periodo seleccionado pero no han vuelto a comprar en los ultimos <strong>{dias} dias</strong>.</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Cliente</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Documento</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500">Ultima Compra</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500">Dias sin comprar</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500">Total Historico</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inactivosFiltrados.map(c => (
                <tr key={c.id_cliente} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-800">{c.nombre}</td>
                  <td className="px-3 py-2 text-gray-500">{c.documento}</td>
                  <td className="px-3 py-2 text-right">{c.ultima_compra}</td>
                  <td className="px-3 py-2 text-right">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{c.dias_sin_comprar}d</span>
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{formatMoney(c.total_historico)}</td>
                </tr>
              ))}
              {inactivosFiltrados.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">No se encontraron clientes inactivos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RankingClientesPage;
