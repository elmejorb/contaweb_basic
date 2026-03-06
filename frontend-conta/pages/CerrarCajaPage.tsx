import React, { useState, FC, useEffect, useMemo } from 'react';
import { CashIcon, CheckIcon, XIcon } from '../components/icons/IconComponents';
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

const CerrarCajaPage: FC<PageProps> = ({ setActivePage }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cajaAbierta, setCajaAbierta] = useState<CierreCaja | null>(null);
  const [resumen, setResumen] = useState<ResumenCajaActual | null>(null);
  const [ultimosMovimientos, setUltimosMovimientos] = useState<MovimientoCaja[]>([]);

  // Campos del arqueo
  const [arqueoBilletes, setArqueoBilletes] = useState('');
  const [arqueoMonedas, setArqueoMonedas] = useState('');
  const [arqueoCheques, setArqueoCheques] = useState('');
  const [baseSiguiente, setBaseSiguiente] = useState('');
  const [observaciones, setObservaciones] = useState('');

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

  const verificarCajaActiva = async () => {
    setLoading(true);
    try {
      const id_empresa = getUserEmpresa();
      const response = await cierreCajaService.resumenCajaActual(id_empresa);

      if (response.caja_abierta && response.caja) {
        setCajaAbierta(response.caja);
        setResumen(response.resumen || null);
        setUltimosMovimientos(response.ultimos_movimientos || []);
      } else {
        setCajaAbierta(null);
        setResumen(null);
        setUltimosMovimientos([]);
      }
    } catch (err: any) {
      console.error('Error al verificar caja:', err);
      showError('Error al verificar estado de la caja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verificarCajaActiva();
  }, []);

  // Calcular totales del arqueo
  const arqueoTotal = useMemo(() => {
    return parseMontoInput(arqueoBilletes) +
           parseMontoInput(arqueoMonedas) +
           parseMontoInput(arqueoCheques);
  }, [arqueoBilletes, arqueoMonedas, arqueoCheques]);

  const diferencia = useMemo(() => {
    if (!resumen) return 0;
    return arqueoTotal - resumen.saldo_actual;
  }, [arqueoTotal, resumen]);

  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cajaAbierta) {
      showError('No hay caja abierta para cerrar');
      return;
    }

    const billetes = parseMontoInput(arqueoBilletes);
    const monedas = parseMontoInput(arqueoMonedas);
    const cheques = parseMontoInput(arqueoCheques);
    const base = parseMontoInput(baseSiguiente);

    if (billetes === 0 && monedas === 0 && cheques === 0) {
      showError('Debe ingresar al menos un valor en el arqueo');
      return;
    }

    setSubmitting(true);
    try {
      await cierreCajaService.cerrarCajaCompleto(cajaAbierta.id_cierre, {
        arqueo_billetes: billetes,
        arqueo_monedas: monedas,
        arqueo_cheques: cheques,
        base_siguiente: base,
        observaciones: observaciones || undefined
      });

      success('Caja cerrada exitosamente');

      // Limpiar formulario y redirigir
      setTimeout(() => {
        setActivePage('Cierres de Caja');
      }, 1500);
    } catch (err: any) {
      showError(err.mensaje || 'Error al cerrar la caja');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Verificando estado de caja...</span>
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
          <h1 className="text-3xl font-bold text-gray-800">Cerrar Caja</h1>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="p-4 bg-yellow-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <XIcon className="h-10 w-10 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No hay caja abierta</h2>
            <p className="text-gray-600 mb-6">
              Debe abrir la caja antes de poder cerrarla
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

      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Cerrar Caja</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo - Resumen */}
          <div className="space-y-4">
            {/* Estado de caja */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
                <div className="flex items-center">
                  <CashIcon className="h-6 w-6 mr-2" />
                  <span className="font-semibold">Caja Abierta desde</span>
                </div>
                <p className="text-2xl font-bold mt-1">{formatDateTime(cajaAbierta.created_at || cajaAbierta.fecha)}</p>
              </div>
            </div>

            {/* Resumen de movimientos */}
            {resumen && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4">Resumen del Día</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Base Inicial</span>
                    <span className="font-semibold">{formatCurrency(resumen.base_inicial)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-green-600">+ Entradas</span>
                    <span className="font-semibold text-green-600">{formatCurrency(resumen.total_entradas)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-red-600">- Salidas</span>
                    <span className="font-semibold text-red-600">{formatCurrency(resumen.total_salidas)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-purple-50 -mx-4 px-4 rounded">
                    <span className="font-bold text-purple-700">Saldo Esperado</span>
                    <span className="font-bold text-purple-700 text-lg">{formatCurrency(resumen.saldo_actual)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Últimos movimientos */}
            {ultimosMovimientos.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Últimos Movimientos</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {ultimosMovimientos.map((mov) => (
                    <div
                      key={mov.id_movimiento}
                      className={`flex justify-between items-center py-2 px-3 rounded ${
                        mov.tipo === 'entrada' ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{mov.concepto}</p>
                        <p className="text-xs text-gray-500">
                          {mov.created_at ? formatDateTime(mov.created_at) : ''}
                        </p>
                      </div>
                      <span className={`font-semibold ${
                        mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{formatCurrency(mov.monto)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel derecho - Formulario de arqueo */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
              <h2 className="text-xl font-bold">Arqueo de Caja</h2>
              <p className="text-indigo-200 text-sm">Ingrese el conteo físico del efectivo</p>
            </div>

            <form onSubmit={handleCerrarCaja} className="p-4 space-y-4">
              {/* Conteo de efectivo */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billetes</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      value={arqueoBilletes}
                      onChange={(e) => setArqueoBilletes(formatMontoInput(e.target.value))}
                      placeholder="0"
                      className="block w-full pl-8 pr-4 py-3 text-right text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-amber-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monedas</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      value={arqueoMonedas}
                      onChange={(e) => setArqueoMonedas(formatMontoInput(e.target.value))}
                      placeholder="0"
                      className="block w-full pl-8 pr-4 py-3 text-right text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-amber-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cheques</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      value={arqueoCheques}
                      onChange={(e) => setArqueoCheques(formatMontoInput(e.target.value))}
                      placeholder="0"
                      className="block w-full pl-8 pr-4 py-3 text-right text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-amber-50"
                    />
                  </div>
                </div>
              </div>

              {/* Total arqueo */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-indigo-700">Total Arqueo</span>
                  <span className="text-2xl font-bold text-indigo-700">{formatCurrency(arqueoTotal)}</span>
                </div>
              </div>

              {/* Diferencia */}
              {resumen && arqueoTotal > 0 && (
                <div className={`rounded-lg p-4 ${diferencia >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${diferencia >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      Diferencia
                    </span>
                    <span className={`text-2xl font-bold ${diferencia >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(diferencia)}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {diferencia > 0 ? 'Sobrante' : diferencia < 0 ? 'Faltante' : 'Cuadre exacto'}
                  </p>
                </div>
              )}

              {/* Base siguiente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base para el día siguiente
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    value={baseSiguiente}
                    onChange={(e) => setBaseSiguiente(formatMontoInput(e.target.value))}
                    placeholder="0"
                    className="block w-full pl-8 pr-4 py-3 text-right text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-amber-50"
                  />
                </div>
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
                  placeholder="Notas adicionales sobre el cierre..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActivePage('Abrir caja')}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || arqueoTotal === 0}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Cerrando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Cerrar Caja
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CerrarCajaPage;
