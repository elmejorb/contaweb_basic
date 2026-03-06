import React, { useState, FC, useEffect } from 'react';
import { CashIcon, CheckIcon, XIcon, PlusIcon, SearchIcon } from '../components/icons/IconComponents';
import { cierreCajaService, CierreCaja, ResumenCajaActual, MovimientoCaja } from '../services/cierreCajaService';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

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

const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const MovimientoCajaPage: FC<PageProps> = ({ setActivePage }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cajaAbierta, setCajaAbierta] = useState<CierreCaja | null>(null);
  const [resumen, setResumen] = useState<ResumenCajaActual | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);

  // Formulario
  const [tipoMovimiento, setTipoMovimiento] = useState<'entrada' | 'salida'>('entrada');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [referencia, setReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'salida'>('todos');

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

  const parseMontoInput = (value: string): number => {
    const cleaned = value.replace(/[^0-9]/g, '');
    return cleaned ? parseInt(cleaned) : 0;
  };

  const formatMontoInput = (value: string): string => {
    const number = parseMontoInput(value);
    return number ? number.toLocaleString('es-CO') : '';
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const id_empresa = getUserEmpresa();

      // Cargar resumen de caja
      const resumenResponse = await cierreCajaService.resumenCajaActual(id_empresa);

      if (resumenResponse.caja_abierta && resumenResponse.caja) {
        setCajaAbierta(resumenResponse.caja);
        setResumen(resumenResponse.resumen || null);

        // Cargar movimientos de esta caja
        const movResponse = await cierreCajaService.listarMovimientos({
          id_empresa,
          id_cierre: resumenResponse.caja.id_cierre,
          perPage: 50,
          sortOrder: 'desc'
        });
        setMovimientos(movResponse.movimientos);
      } else {
        setCajaAbierta(null);
        setResumen(null);
        setMovimientos([]);
      }
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      showError('Error al cargar datos de la caja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const montoNum = parseMontoInput(monto);
    if (montoNum <= 0) {
      showError('El monto debe ser mayor a 0');
      return;
    }

    if (!concepto.trim()) {
      showError('Debe ingresar un concepto');
      return;
    }

    setSubmitting(true);
    try {
      const id_empresa = getUserEmpresa();

      await cierreCajaService.crearMovimiento({
        id_empresa,
        tipo: tipoMovimiento,
        concepto: concepto.trim(),
        monto: montoNum,
        referencia: referencia.trim() || undefined,
        observaciones: observaciones.trim() || undefined
      });

      success(`${tipoMovimiento === 'entrada' ? 'Entrada' : 'Salida'} registrada exitosamente`);

      // Limpiar formulario
      setConcepto('');
      setMonto('');
      setReferencia('');
      setObservaciones('');

      // Recargar datos
      await cargarDatos();
    } catch (err: any) {
      showError(err.mensaje || 'Error al registrar movimiento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnular = async (id: number) => {
    if (!confirm('¿Está seguro de anular este movimiento?')) return;

    try {
      await cierreCajaService.anularMovimiento(id);
      success('Movimiento anulado');
      await cargarDatos();
    } catch (err: any) {
      showError(err.mensaje || 'Error al anular movimiento');
    }
  };

  const movimientosFiltrados = movimientos.filter(mov => {
    if (filtroTipo === 'todos') return true;
    return mov.tipo === filtroTipo;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Cargando datos de caja...</span>
      </div>
    );
  }

  if (!cajaAbierta) {
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

        <div className="space-y-6 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800">Movimientos de Caja</h1>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="p-4 bg-yellow-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <XIcon className="h-10 w-10 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No hay caja abierta</h2>
            <p className="text-gray-600 mb-6">
              Debe abrir la caja para poder registrar movimientos
            </p>
            <button
              onClick={() => setActivePage('Abrir caja')}
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ir a Abrir Caja
            </button>
          </div>
        </div>
      </>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-800">Movimientos de Caja</h1>
        </div>

        {/* Resumen superior */}
        {resumen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-indigo-50 rounded-lg p-4 shadow">
              <p className="text-xs text-indigo-600 font-medium">Base Inicial</p>
              <p className="text-xl font-bold text-indigo-700">{formatCurrency(resumen.base_inicial)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 shadow">
              <p className="text-xs text-green-600 font-medium">Total Entradas</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(resumen.total_entradas)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 shadow">
              <p className="text-xs text-red-600 font-medium">Total Salidas</p>
              <p className="text-xl font-bold text-red-700">{formatCurrency(resumen.total_salidas)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 shadow">
              <p className="text-xs text-purple-600 font-medium">Saldo Actual</p>
              <p className="text-xl font-bold text-purple-700">{formatCurrency(resumen.saldo_actual)}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario de nuevo movimiento */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-4">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                <h2 className="text-lg font-bold flex items-center">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nuevo Movimiento
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Tipo de movimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoMovimiento('entrada')}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        tipoMovimiento === 'entrada'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      + Entrada
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoMovimiento('salida')}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        tipoMovimiento === 'salida'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      - Salida
                    </button>
                  </div>
                </div>

                {/* Concepto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Concepto *
                  </label>
                  <input
                    type="text"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    placeholder="Ej: Venta de producto, Pago proveedor..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-amber-50"
                    required
                  />
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      value={monto}
                      onChange={(e) => setMonto(formatMontoInput(e.target.value))}
                      placeholder="0"
                      className="block w-full pl-8 pr-4 py-3 text-right text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-amber-50"
                      required
                    />
                  </div>
                </div>

                {/* Referencia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referencia (opcional)
                  </label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Ej: Factura #123"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={2}
                    placeholder="Notas adicionales..."
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !concepto || !monto}
                  className={`w-full flex items-center justify-center px-4 py-3 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    tipoMovimiento === 'entrada'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Registrar {tipoMovimiento === 'entrada' ? 'Entrada' : 'Salida'}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Lista de movimientos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">
                  Movimientos del día ({movimientos.length})
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFiltroTipo('todos')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      filtroTipo === 'todos'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroTipo('entrada')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      filtroTipo === 'entrada'
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Entradas
                  </button>
                  <button
                    onClick={() => setFiltroTipo('salida')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      filtroTipo === 'salida'
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Salidas
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {movimientosFiltrados.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <CashIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay movimientos registrados</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Concepto
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Monto
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {movimientosFiltrados.map((mov) => (
                        <tr
                          key={mov.id_movimiento}
                          className={`hover:bg-gray-50 ${mov.anulado ? 'opacity-50 bg-gray-100' : ''}`}
                        >
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {mov.created_at ? formatDateTime(mov.created_at).split(' ')[1] : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className={`text-sm font-medium ${mov.anulado ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {mov.concepto}
                              </p>
                              {mov.referencia && (
                                <p className="text-xs text-gray-500">Ref: {mov.referencia}</p>
                              )}
                              {mov.anulado && (
                                <span className="text-xs text-red-500 font-medium">ANULADO</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              mov.tipo === 'entrada'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${
                            mov.anulado ? 'text-gray-400' :
                            mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {mov.tipo === 'entrada' ? '+' : '-'}{formatCurrency(mov.monto)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {!mov.anulado && (
                              <button
                                onClick={() => handleAnular(mov.id_movimiento)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Anular movimiento"
                              >
                                <XIcon className="h-5 w-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="mt-4 flex gap-4 justify-center">
              <button
                onClick={() => setActivePage('Abrir caja')}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Ver estado de caja
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setActivePage('Cerrar Caja')}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Cerrar caja
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MovimientoCajaPage;
