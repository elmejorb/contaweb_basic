import React, { useState, useEffect, useMemo, FC } from 'react';
import { SearchIcon } from '../components/icons/IconComponents';
import { pagoService, Pago } from '../services/pagoService';

interface PageProps {
  setActivePage: (page: string) => void;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const parseFecha = (fecha: string): string => {
  if (!fecha) return '—';
  const f = fecha.split('T')[0];
  const [y, m, d] = f.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? fecha : date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getDefaultDateRange = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return {
    inicio: `${y}-${m}-01`,
    fin: `${y}-${m}-${d}`,
  };
};

const PagosListPage: FC<PageProps> = ({ setActivePage }) => {
  const defaultRange = getDefaultDateRange();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaInicio, setFechaInicio] = useState(defaultRange.inicio);
  const [fechaFin, setFechaFin] = useState(defaultRange.fin);
  const itemsPerPage = 50;

  const getUserEmpresa = () => {
    const id = localStorage.getItem('empresa_activa_id');
    if (id) return parseInt(id);
    const userData = localStorage.getItem('user_data');
    if (userData) return JSON.parse(userData).id_empresa || 1;
    return 1;
  };

  const cargarPagos = async (page = 1, buscar = '', fInicio = fechaInicio, fFin = fechaFin) => {
    setLoading(true);
    try {
      const resp = await pagoService.listar({
        id_empresa: getUserEmpresa(),
        page,
        perPage: itemsPerPage,
        buscar: buscar || undefined,
        fecha_inicio: fInicio || undefined,
        fecha_fin: fFin || undefined,
      });
      setPagos(resp.pagos);
      setTotalItems(resp.total);
      setLastPage(resp.last_page);
      setCurrentPage(resp.current_page);
    } catch (e) {
      console.error('Error cargando pagos:', e);
    } finally {
      setLoading(false);
    }
  };

  const fechaInicioRef = React.useRef(fechaInicio);
  const fechaFinRef = React.useRef(fechaFin);
  fechaInicioRef.current = fechaInicio;
  fechaFinRef.current = fechaFin;

  useEffect(() => { cargarPagos(1, '', fechaInicio, fechaFin); }, []);

  useEffect(() => {
    const timer = setTimeout(() => { cargarPagos(1, searchTerm, fechaInicioRef.current, fechaFinRef.current); }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFiltrarFechas = () => {
    cargarPagos(1, searchTerm, fechaInicio, fechaFin);
  };

  const handleLimpiarFiltros = () => {
    const range = getDefaultDateRange();
    setFechaInicio(range.inicio);
    setFechaFin(range.fin);
    setSearchTerm('');
    cargarPagos(1, '', range.inicio, range.fin);
  };

  const totales = useMemo(() => {
    let totalPagos = 0;
    let totalSaldo = 0;
    pagos.forEach(p => {
      totalPagos += Number(p.valor_pago) || 0;
      totalSaldo += Number(p.saldo_actual) || 0;
    });
    return { totalPagos, totalSaldo };
  }, [pagos]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Listado de Pagos</h2>
        <p className="text-sm text-gray-500 mt-1">{totalItems} pagos registrados</p>
      </div>

      {/* Filtros de fecha */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleFiltrarFechas}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >Filtrar</button>
          <button
            onClick={handleLimpiarFiltros}
            className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
          >Limpiar Filtros</button>
        </div>
      </div>

      {/* Tarjetas de totales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-sm font-medium text-green-600">Total Pagado</p>
          <p className="text-2xl font-bold text-green-800 mt-1">{formatCurrency(totales.totalPagos)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-sm font-medium text-red-600">Total Saldo Pendiente</p>
          <p className="text-2xl font-bold text-red-800 mt-1">{formatCurrency(totales.totalSaldo)}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, factura, detalle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Recibo</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Factura</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Detalle</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Valor Factura</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Valor Pago</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Cargando pagos...</td></tr>
              ) : pagos.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">No se encontraron pagos</td></tr>
              ) : (
                pagos.map((pago) => (
                  <tr key={pago.id_pago} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">{parseFecha(pago.fecha || '')}</td>
                    <td className="px-4 py-3 font-medium text-indigo-600">{pago.rec_caja_n || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{pago.factura_n || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{pago.detalle_pago || '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(pago.valor_factura)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(pago.valor_pago)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={Number(pago.saldo_actual) > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                        {formatCurrency(pago.saldo_actual)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {lastPage > 1 && (
          <div className="p-4 border-t flex justify-between items-center">
            <span className="text-sm text-gray-500">Página {currentPage} de {lastPage}</span>
            <div className="flex space-x-2">
              <button
                onClick={() => cargarPagos(currentPage - 1, searchTerm, fechaInicio, fechaFin)}
                disabled={currentPage <= 1}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-100 border disabled:opacity-50"
              >Anterior</button>
              <button
                onClick={() => cargarPagos(currentPage + 1, searchTerm, fechaInicio, fechaFin)}
                disabled={currentPage >= lastPage}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-100 border disabled:opacity-50"
              >Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PagosListPage;
