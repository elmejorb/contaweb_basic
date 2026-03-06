import React, { useState, FC, useEffect, useMemo } from 'react';
import { SearchIcon, XIcon, CheckIcon, EyeIcon } from '../components/icons/IconComponents';
import { cierreCajaService, CierreCaja } from '../services/cierreCajaService';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

interface PageProps {
  setActivePage: (page: string) => void;
}

// Formatear número como moneda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Formatear fecha
const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Modal de detalle del cierre
const CierreDetalleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cierre: CierreCaja | null;
  onCerrar: (id: number) => void;
  onAprobar: (id: number) => void;
}> = ({ isOpen, onClose, cierre, onCerrar, onAprobar }) => {
  if (!isOpen || !cierre) return null;

  const labelStyle = "text-xs font-medium text-gray-500";
  const valueStyle = "text-sm font-semibold text-gray-900";
  const sectionStyle = "bg-gray-50 rounded-lg p-3";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-modal-backdrop">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl animate-modal-content" style={{ maxHeight: '95vh' }}>
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-lg">
          <div>
            <h3 className="text-xl font-semibold text-white">
              Cierre de Caja - {formatDate(cierre.fecha)}
            </h3>
            <p className="text-indigo-200 text-sm">
              {cierre.usuario ? `${cierre.usuario.nombre_us} ${cierre.usuario.apellido_us}` : 'Todos los usuarios'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cierreCajaService.getColorEstado(cierre.estado)}`}>
              {cierreCajaService.getNombreEstado(cierre.estado)}
            </span>
            <button onClick={onClose} className="p-1 rounded-full text-white hover:bg-white/20">
              <XIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(95vh - 180px)' }}>
          {/* Resumen principal */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-xs text-green-600 font-medium">Total Venta del Día</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(cierre.total_venta_dia)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-xs text-blue-600 font-medium">Total Efectivo</p>
              <p className="text-xl font-bold text-blue-700">{formatCurrency(cierre.total_efectivo)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-xs text-purple-600 font-medium">Saldo en Libros</p>
              <p className="text-xl font-bold text-purple-700">{formatCurrency(cierre.saldo_libros)}</p>
            </div>
            <div className={`rounded-lg p-4 text-center ${cierre.diferencia >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className={`text-xs font-medium ${cierre.diferencia >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Diferencia</p>
              <p className={`text-xl font-bold ${cierre.diferencia >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatCurrency(cierre.diferencia)}
              </p>
            </div>
          </div>

          {/* Ventas por tipo */}
          <div className={sectionStyle}>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Ventas por Tipo de Pago</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className={labelStyle}>Contado</p>
                <p className={valueStyle}>{formatCurrency(cierre.ventas_contado)}</p>
              </div>
              <div>
                <p className={labelStyle}>Crédito</p>
                <p className={valueStyle}>{formatCurrency(cierre.ventas_credito)}</p>
              </div>
              <div>
                <p className={labelStyle}>Tarjeta</p>
                <p className={valueStyle}>{formatCurrency(cierre.ventas_tarjeta)}</p>
              </div>
              <div>
                <p className={labelStyle}>Transferencia</p>
                <p className={valueStyle}>{formatCurrency(cierre.ventas_transferencia)}</p>
              </div>
              <div>
                <p className={labelStyle}>Nequi/Daviplata</p>
                <p className={valueStyle}>{formatCurrency(cierre.ventas_nequi)}</p>
              </div>
            </div>
          </div>

          {/* Otros movimientos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={sectionStyle}>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Ingresos</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={labelStyle}>Pagos de Clientes</span>
                  <span className={valueStyle}>{formatCurrency(cierre.pagos_clientes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={labelStyle}>Otros Ingresos</span>
                  <span className={valueStyle}>{formatCurrency(cierre.otros_ingresos)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={labelStyle}>Separados</span>
                  <span className={valueStyle}>{formatCurrency(cierre.separados)}</span>
                </div>
              </div>
            </div>

            <div className={sectionStyle}>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Egresos</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={labelStyle}>Gastos/Egresos</span>
                  <span className={valueStyle}>{formatCurrency(cierre.egresos)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={labelStyle}>Devoluciones Ventas</span>
                  <span className={valueStyle}>{formatCurrency(cierre.devoluciones_ventas)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={labelStyle}>Pagos Proveedores</span>
                  <span className={valueStyle}>{formatCurrency(cierre.pagos_proveedores)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Arqueo de caja */}
          <div className={sectionStyle}>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Arqueo de Caja</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className={labelStyle}>Base Inicial</p>
                <p className={valueStyle}>{formatCurrency(cierre.base_inicial)}</p>
              </div>
              <div>
                <p className={labelStyle}>Billetes</p>
                <p className={valueStyle}>{formatCurrency(cierre.arqueo_billetes)}</p>
              </div>
              <div>
                <p className={labelStyle}>Monedas</p>
                <p className={valueStyle}>{formatCurrency(cierre.arqueo_monedas)}</p>
              </div>
              <div>
                <p className={labelStyle}>Cheques</p>
                <p className={valueStyle}>{formatCurrency(cierre.arqueo_cheques)}</p>
              </div>
              <div>
                <p className={labelStyle}>Base Siguiente</p>
                <p className={valueStyle}>{formatCurrency(cierre.base_siguiente)}</p>
              </div>
            </div>
          </div>

          {/* Inventario */}
          {cierre.valor_inventario > 0 && (
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-amber-700">Valor del Inventario al Cierre</span>
                <span className="text-lg font-bold text-amber-800">{formatCurrency(cierre.valor_inventario)}</span>
              </div>
            </div>
          )}

          {/* Observaciones */}
          {cierre.observaciones && (
            <div className={sectionStyle}>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Observaciones</h4>
              <p className="text-sm text-gray-600">{cierre.observaciones}</p>
            </div>
          )}

          {/* Info de aprobación */}
          {cierre.estado === 2 && cierre.aprobador && (
            <div className="bg-green-50 rounded-lg p-3 text-sm">
              <span className="text-green-700">
                Aprobado por <strong>{cierre.aprobador.nombre_us} {cierre.aprobador.apellido_us}</strong>
                {cierre.fecha_aprobacion && ` el ${formatDate(cierre.fecha_aprobacion)}`}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-b-lg border-t flex justify-end space-x-2">
          {cierre.estado === 0 && (
            <button
              onClick={() => onCerrar(cierre.id_cierre)}
              className="flex items-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              Cerrar Caja
            </button>
          )}
          {cierre.estado === 1 && (
            <button
              onClick={() => onAprobar(cierre.id_cierre)}
              className="flex items-center bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              Aprobar
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const CierresCajaPage: FC<PageProps> = ({ setActivePage }) => {
  const [cierres, setCierres] = useState<CierreCaja[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<number | ''>('');
  const [origenFiltro, setOrigenFiltro] = useState<'todos' | 'web' | 'vb6'>('todos');

  // Modal
  const [selectedCierre, setSelectedCierre] = useState<CierreCaja | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { toasts, removeToast, success, error: showError } = useToast();

  const getUserEmpresa = () => {
    const empresaActivaId = localStorage.getItem('empresa_activa_id');
    if (empresaActivaId) {
      return parseInt(empresaActivaId);
    }
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id_empresa || 1;
    }
    return 1;
  };

  const fetchCierres = async () => {
    setLoading(true);
    setError(null);
    try {
      const id_empresa = getUserEmpresa();
      const params: any = {
        page: currentPage,
        perPage: itemsPerPage,
        id_empresa,
        sortBy: 'fecha',
        sortOrder: 'desc'
      };

      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      if (estadoFiltro !== '') params.estado = estadoFiltro;
      if (origenFiltro !== 'todos') params.origen = origenFiltro;

      const response = await cierreCajaService.listar(params);
      setCierres(response.cierres);
      setTotalItems(response.total);
    } catch (err: any) {
      console.error('Error al cargar cierres:', err);
      setError(err.mensaje || 'Error al cargar los cierres de caja');
      setCierres([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCierres();
  }, [currentPage, fechaDesde, fechaHasta, estadoFiltro, origenFiltro]);

  const handleVerDetalle = async (cierre: CierreCaja) => {
    try {
      const cierreCompleto = await cierreCajaService.obtener(cierre.id_cierre);
      setSelectedCierre(cierreCompleto);
      setIsModalOpen(true);
    } catch (err: any) {
      showError(err.mensaje || 'Error al obtener detalle');
    }
  };

  const handleCerrar = async (id: number) => {
    try {
      await cierreCajaService.cerrar(id);
      success('Cierre de caja cerrado exitosamente');
      setIsModalOpen(false);
      fetchCierres();
    } catch (err: any) {
      showError(err.mensaje || 'Error al cerrar caja');
    }
  };

  const handleAprobar = async (id: number) => {
    try {
      await cierreCajaService.aprobar(id);
      success('Cierre de caja aprobado exitosamente');
      setIsModalOpen(false);
      fetchCierres();
    } catch (err: any) {
      showError(err.mensaje || 'Error al aprobar cierre');
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Función helper para obtener valor numérico seguro
  const getNumericValue = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Calcular total venta del día (si no existe, usar ventas_contado + ventas_credito)
  const calcularTotalVenta = (cierre: CierreCaja): number => {
    if (cierre.total_venta_dia && getNumericValue(cierre.total_venta_dia) > 0) {
      return getNumericValue(cierre.total_venta_dia);
    }
    return getNumericValue(cierre.ventas_contado) + getNumericValue(cierre.ventas_credito);
  };

  // Calcular total efectivo (si no existe, usar base + ventas_contado + pagos - egresos)
  const calcularTotalEfectivo = (cierre: CierreCaja): number => {
    if (cierre.total_efectivo && getNumericValue(cierre.total_efectivo) > 0) {
      return getNumericValue(cierre.total_efectivo);
    }
    return getNumericValue(cierre.base_inicial) +
           getNumericValue(cierre.ventas_contado) +
           getNumericValue(cierre.pagos_clientes) -
           getNumericValue(cierre.egresos);
  };

  // Calcular totales
  const totales = useMemo(() => {
    return cierres.reduce((acc, cierre) => ({
      ventas: acc.ventas + calcularTotalVenta(cierre),
      efectivo: acc.efectivo + calcularTotalEfectivo(cierre),
      diferencias: acc.diferencias + getNumericValue(cierre.diferencia)
    }), { ventas: 0, efectivo: 0, diferencias: 0 });
  }, [cierres]);

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Cierres de Caja</h1>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={estadoFiltro}
                onChange={(e) => {
                  setEstadoFiltro(e.target.value === '' ? '' : parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                <option value="0">Abierto</option>
                <option value="1">Cerrado</option>
                <option value="2">Aprobado</option>
                <option value="-1">Anulado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Origen</label>
              <select
                value={origenFiltro}
                onChange={(e) => {
                  setOrigenFiltro(e.target.value as 'todos' | 'web' | 'vb6');
                  setCurrentPage(1);
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todos">Todos</option>
                <option value="web">Solo Web</option>
                <option value="vb6">Solo VB6 (Local)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFechaDesde('');
                  setFechaHasta('');
                  setEstadoFiltro('');
                  setOrigenFiltro('todos');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Resumen */}
        {cierres.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 shadow-md">
              <p className="text-sm text-green-600 font-medium">Total Ventas</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totales.ventas)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 shadow-md">
              <p className="text-sm text-blue-600 font-medium">Total Efectivo</p>
              <p className="text-2xl font-bold text-blue-700">{formatCurrency(totales.efectivo)}</p>
            </div>
            <div className={`rounded-lg p-4 shadow-md ${totales.diferencias >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium ${totales.diferencias >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                Total Diferencias
              </p>
              <p className={`text-2xl font-bold ${totales.diferencias >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatCurrency(totales.diferencias)}
              </p>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Venta
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efectivo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diferencia
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="ml-3 text-gray-600">Cargando cierres...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : cierres.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-600">
                      No se encontraron cierres de caja
                    </td>
                  </tr>
                ) : (
                  cierres.map((cierre) => (
                    <tr key={cierre.id_cierre} className="bg-white hover:bg-gray-50">
                      <td className="border-t border-gray-200 px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{formatDate(cierre.fecha)}</span>
                          {cierre.codvb6 ? (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-700 rounded">
                              VB6
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded">
                              WEB
                            </span>
                          )}
                        </div>
                        {cierre.codvb6 && (
                          <div className="text-xs text-gray-500">Cod: {cierre.codvb6}</div>
                        )}
                      </td>
                      <td className="border-t border-gray-200 px-4 py-3 text-sm text-gray-700">
                        {cierre.usuario
                          ? `${cierre.usuario.nombre_us} ${cierre.usuario.apellido_us}`
                          : <span className="text-gray-400 italic">Todos</span>
                        }
                      </td>
                      <td className="border-t border-gray-200 px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(calcularTotalVenta(cierre))}
                      </td>
                      <td className="border-t border-gray-200 px-4 py-3 text-sm text-right text-gray-700">
                        {formatCurrency(calcularTotalEfectivo(cierre))}
                      </td>
                      <td className={`border-t border-gray-200 px-4 py-3 text-sm text-right font-semibold ${
                        getNumericValue(cierre.diferencia) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(getNumericValue(cierre.diferencia))}
                      </td>
                      <td className="border-t border-gray-200 px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cierreCajaService.getColorEstado(cierre.estado)}`}>
                          {cierreCajaService.getNombreEstado(cierre.estado)}
                        </span>
                      </td>
                      <td className="border-t border-gray-200 px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleVerDetalle(cierre)}
                            className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                            title="Ver detalle"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-end">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-100 border disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white rounded-lg hover:bg-gray-100 border disabled:opacity-50"
              >
                Siguiente
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      <CierreDetalleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cierre={selectedCierre}
        onCerrar={handleCerrar}
        onAprobar={handleAprobar}
      />
    </>
  );
};

export default CierresCajaPage;
