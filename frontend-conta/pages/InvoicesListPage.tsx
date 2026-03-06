import React, { useState, useEffect, useMemo, FC } from 'react';
import { SearchIcon } from '../components/icons/IconComponents';
import { ventaService, Venta } from '../services/ventaService';
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

const calcDiasDesde = (fecha: string): number => {
  if (!fecha) return 0;
  const f = fecha.split('T')[0];
  const [y, m, d] = f.split('-').map(Number);
  const fechaVenta = new Date(y, m - 1, d);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diff = hoy.getTime() - fechaVenta.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
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

// ==================== Modal Cliente ====================
const ClienteModal: FC<{ cliente: Venta['cliente']; onClose: () => void }> = ({ cliente, onClose }) => {
  if (!cliente) return null;
  const campo = (label: string, value?: string | null) => value ? (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 uppercase">{label}</span>
      <p className="text-sm text-gray-800 font-medium mt-0.5">{value}</p>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-semibold text-lg">Datos del Cliente</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl font-bold leading-none">&times;</button>
        </div>
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          <div className="mb-3">
            <p className="text-lg font-bold text-gray-800">{cliente.nombre_razon_social}</p>
          </div>
          {campo('Documento', cliente.numero_documento)}
          {campo('Tipo Documento', cliente.tipo_documento)}
          {campo('Teléfono', cliente.telefono)}
          {campo('Celular', cliente.celular)}
          {campo('WhatsApp', cliente.whatsapp)}
          {campo('Email', cliente.email)}
          {campo('Dirección', cliente.direccion)}
          {campo('Departamento', cliente.departamento)}
          {campo('Municipio', cliente.municipio)}
          {campo('Código VB6', cliente.codvb6)}
        </div>
        <div className="px-6 py-3 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// ==================== Modal Pagos ====================
const PagosModal: FC<{ facturaNum: string; pagos: Pago[]; loading: boolean; onClose: () => void }> = ({ facturaNum, pagos, loading, onClose }) => {
  const totalPagado = pagos.reduce((acc, p) => acc + (Number(p.valor_pago) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-semibold text-lg">Pagos - Factura N° {facturaNum}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl font-bold leading-none">&times;</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Cargando pagos...</div>
          ) : pagos.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No se encontraron pagos para esta factura</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Recibo</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Detalle</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Valor Pago</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map(pago => (
                  <tr key={pago.id_pago} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{parseFecha(pago.fecha || '')}</td>
                    <td className="px-4 py-3 font-medium text-indigo-600">{pago.rec_caja_n || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{pago.detalle_pago || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(pago.valor_pago)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={Number(pago.saldo_actual) > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                        {formatCurrency(pago.saldo_actual)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
          <div className="text-sm">
            <span className="text-gray-500">Total pagado: </span>
            <span className="font-bold text-green-700">{formatCurrency(totalPagado)}</span>
            <span className="text-gray-400 ml-2">({pagos.length} pago{pagos.length !== 1 ? 's' : ''})</span>
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// ==================== Iconos inline ====================
const EyeIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

// ==================== Página principal ====================
const InvoicesListPage: FC<PageProps> = ({ setActivePage }) => {
  const defaultRange = getDefaultDateRange();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaInicio, setFechaInicio] = useState(defaultRange.inicio);
  const [fechaFin, setFechaFin] = useState(defaultRange.fin);
  const itemsPerPage = 50;

  // Modales
  const [clienteModal, setClienteModal] = useState<Venta['cliente'] | null>(null);
  const [pagosModal, setPagosModal] = useState<{ facturaNum: string; pagos: Pago[]; loading: boolean } | null>(null);

  const getUserEmpresa = () => {
    const id = localStorage.getItem('empresa_activa_id');
    if (id) return parseInt(id);
    const userData = localStorage.getItem('user_data');
    if (userData) return JSON.parse(userData).id_empresa || 1;
    return 1;
  };

  const cargarVentas = async (page = 1, buscar = '', fInicio = fechaInicio, fFin = fechaFin) => {
    setLoading(true);
    try {
      const resp = await ventaService.listar({
        id_empresa: getUserEmpresa(),
        page,
        perPage: itemsPerPage,
        buscar: buscar || undefined,
        fecha_inicio: fInicio || undefined,
        fecha_fin: fFin || undefined,
      });
      setVentas(resp.ventas);
      setTotalItems(resp.total);
      setLastPage(resp.last_page);
      setCurrentPage(resp.current_page);
    } catch (e) {
      console.error('Error cargando ventas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarVentas(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => { cargarVentas(1, searchTerm); }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFiltrarFechas = () => {
    cargarVentas(1, searchTerm, fechaInicio, fechaFin);
  };

  const handleLimpiarFiltros = () => {
    const range = getDefaultDateRange();
    setFechaInicio(range.inicio);
    setFechaFin(range.fin);
    setSearchTerm('');
    cargarVentas(1, '', range.inicio, range.fin);
  };

  const handleVerPagos = async (venta: Venta) => {
    setPagosModal({ facturaNum: venta.numero_factura, pagos: [], loading: true });
    try {
      const resp = await pagoService.listar({
        id_empresa: getUserEmpresa(),
        factura_n: Number(venta.numero_factura),
        perPage: 100,
      });
      setPagosModal({ facturaNum: venta.numero_factura, pagos: resp.pagos, loading: false });
    } catch (e) {
      console.error('Error cargando pagos:', e);
      setPagosModal(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  const totales = useMemo(() => {
    let totalVentas = 0;
    let totalContado = 0;
    let totalCredito = 0;
    let totalUtilidad = 0;
    ventas.forEach(v => {
      const monto = Number(v.total) || 0;
      totalVentas += monto;
      totalUtilidad += Number(v.t_utilidad_vent) || 0;
      const fp = (v.forma_pago || '').toLowerCase();
      if (fp === 'credito') {
        totalCredito += monto;
      } else {
        totalContado += monto;
      }
    });
    return { totalVentas, totalContado, totalCredito, totalUtilidad };
  }, [ventas]);

  const getTermino = (fp: string) => {
    const val = (fp || '').toLowerCase();
    if (val === 'credito') return { label: 'Crédito', color: 'text-orange-700', bg: 'bg-orange-100' };
    if (val === 'tarjeta') return { label: 'Tarjeta', color: 'text-blue-700', bg: 'bg-blue-100' };
    if (val === 'transferencia') return { label: 'Transferencia', color: 'text-purple-700', bg: 'bg-purple-100' };
    return { label: 'Contado', color: 'text-green-700', bg: 'bg-green-100' };
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Listado de Ventas</h2>
        <p className="text-sm text-gray-500 mt-1">{totalItems} ventas encontradas</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm font-medium text-blue-600">Total Ventas</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">{formatCurrency(totales.totalVentas)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-sm font-medium text-green-600">Total Contado</p>
          <p className="text-2xl font-bold text-green-800 mt-1">{formatCurrency(totales.totalContado)}</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
          <p className="text-sm font-medium text-orange-600">Total Crédito</p>
          <p className="text-2xl font-bold text-orange-800 mt-1">{formatCurrency(totales.totalCredito)}</p>
        </div>
        <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
          <p className="text-sm font-medium text-violet-600">Utilidad</p>
          <p className="text-2xl font-bold text-violet-800 mt-1">{formatCurrency(totales.totalUtilidad)}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por factura o cliente..."
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
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Factura N°</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">Término</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">Días</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Total</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Utilidad</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center w-16">Pagos</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-400">Cargando ventas...</td></tr>
              ) : ventas.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-400">No se encontraron ventas</td></tr>
              ) : (
                ventas.map((venta) => {
                  const termino = getTermino(venta.forma_pago);
                  const dias = calcDiasDesde(venta.fecha_venta);
                  return (
                    <tr key={venta.id_venta} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600">{parseFecha(venta.fecha_venta)}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-600">{venta.numero_factura}</td>
                      <td className="px-4 py-3">
                        {venta.cliente ? (
                          <button
                            onClick={() => setClienteModal(venta.cliente)}
                            className="text-gray-700 hover:text-indigo-600 hover:underline transition-colors text-left"
                            title="Ver datos del cliente"
                          >
                            {venta.cliente.nombre_razon_social}
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`${termino.bg} ${termino.color} text-xs font-medium px-2.5 py-1 rounded-full`}>{termino.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{dias}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(venta.total)}</td>
                      <td className="px-4 py-3 text-right text-violet-700">{formatCurrency(venta.t_utilidad_vent || 0)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleVerPagos(venta)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Ver pagos de esta factura"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {lastPage > 1 && (
          <div className="p-4 border-t flex justify-between items-center">
            <span className="text-sm text-gray-500">Página {currentPage} de {lastPage}</span>
            <div className="flex space-x-2">
              <button
                onClick={() => cargarVentas(currentPage - 1, searchTerm)}
                disabled={currentPage <= 1}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-100 border disabled:opacity-50"
              >Anterior</button>
              <button
                onClick={() => cargarVentas(currentPage + 1, searchTerm)}
                disabled={currentPage >= lastPage}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-100 border disabled:opacity-50"
              >Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Cliente */}
      {clienteModal && (
        <ClienteModal cliente={clienteModal} onClose={() => setClienteModal(null)} />
      )}

      {/* Modal Pagos */}
      {pagosModal && (
        <PagosModal
          facturaNum={pagosModal.facturaNum}
          pagos={pagosModal.pagos}
          loading={pagosModal.loading}
          onClose={() => setPagosModal(null)}
        />
      )}
    </div>
  );
};

export default InvoicesListPage;
