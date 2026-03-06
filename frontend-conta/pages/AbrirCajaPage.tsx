import React, { useState, FC, useEffect } from 'react';
import { CashIcon, CheckIcon, XIcon } from '../components/icons/IconComponents';
import { cierreCajaService, CierreCaja, ResumenCajaActual } from '../services/cierreCajaService';
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

const AbrirCajaPage: FC<PageProps> = ({ setActivePage }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cajaAbierta, setCajaAbierta] = useState<CierreCaja | null>(null);
  const [resumen, setResumen] = useState<ResumenCajaActual | null>(null);
  const [baseInicial, setBaseInicial] = useState('');
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

  const verificarCajaActiva = async () => {
    setLoading(true);
    try {
      const id_empresa = getUserEmpresa();
      const response = await cierreCajaService.resumenCajaActual(id_empresa);

      if (response.caja_abierta && response.caja) {
        setCajaAbierta(response.caja);
        setResumen(response.resumen || null);
      } else {
        setCajaAbierta(null);
        setResumen(null);
      }
    } catch (err: any) {
      console.error('Error al verificar caja:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verificarCajaActiva();
  }, []);

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();

    const monto = parseFloat(baseInicial.replace(/[^0-9.-]+/g, ''));
    if (isNaN(monto) || monto < 0) {
      showError('Ingrese un monto válido para la base inicial');
      return;
    }

    setSubmitting(true);
    try {
      const id_empresa = getUserEmpresa();
      await cierreCajaService.abrirCaja({
        id_empresa,
        base_inicial: monto
      });

      success('Caja abierta exitosamente');
      setBaseInicial('');
      await verificarCajaActiva();
    } catch (err: any) {
      showError(err.mensaje || 'Error al abrir la caja');
    } finally {
      setSubmitting(false);
    }
  };

  const handleIrACerrarCaja = () => {
    setActivePage('Cerrar Caja');
  };

  const handleIrAMovimientos = () => {
    setActivePage('Movimiento de Caja');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Verificando estado de caja...</span>
      </div>
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

      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Abrir Caja</h1>
        </div>

        {cajaAbierta ? (
          // Caja ya está abierta - mostrar estado actual
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-white/20 rounded-full">
                    <CashIcon className="h-8 w-8" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold">Caja Abierta</h2>
                    <p className="text-green-100">
                      Abierta el {formatDateTime(cajaAbierta.created_at || cajaAbierta.fecha)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-100">Base Inicial</p>
                  <p className="text-3xl font-bold">{formatCurrency(cajaAbierta.base_inicial)}</p>
                </div>
              </div>
            </div>

            {resumen && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen Actual</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-indigo-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-indigo-600 font-medium">Base Inicial</p>
                    <p className="text-xl font-bold text-indigo-700">{formatCurrency(resumen.base_inicial)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-green-600 font-medium">Total Entradas</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(resumen.total_entradas)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-red-600 font-medium">Total Salidas</p>
                    <p className="text-xl font-bold text-red-700">{formatCurrency(resumen.total_salidas)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-purple-600 font-medium">Saldo Actual</p>
                    <p className="text-xl font-bold text-purple-700">{formatCurrency(resumen.saldo_actual)}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-500 text-center mb-6">
                  {resumen.cantidad_movimientos} movimiento(s) registrado(s)
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleIrAMovimientos}
                    className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <CashIcon className="h-5 w-5 mr-2" />
                    Registrar Movimiento
                  </button>
                  <button
                    onClick={handleIrACerrarCaja}
                    className="flex items-center justify-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XIcon className="h-5 w-5 mr-2" />
                    Cerrar Caja
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // No hay caja abierta - formulario para abrir
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center">
                <div className="p-3 bg-white/20 rounded-full">
                  <CashIcon className="h-8 w-8" />
                </div>
                <div className="ml-4">
                  <h2 className="text-2xl font-bold">Apertura de Caja</h2>
                  <p className="text-indigo-200">Ingrese el monto inicial para abrir la caja</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAbrirCaja} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Inicial (COP)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
                  <input
                    type="text"
                    value={baseInicial}
                    onChange={(e) => {
                      // Solo permitir números
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value) {
                        setBaseInicial(parseInt(value).toLocaleString('es-CO'));
                      } else {
                        setBaseInicial('');
                      }
                    }}
                    placeholder="0"
                    className="block w-full pl-10 pr-4 py-4 text-2xl font-bold text-right border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-amber-50"
                    autoFocus
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Ingrese el valor en efectivo con el que inicia el día
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Al abrir la caja:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Se registrará la fecha y hora de apertura</li>
                  <li>• Podrá registrar movimientos de entrada y salida</li>
                  <li>• Al final del día deberá cerrar la caja con el arqueo correspondiente</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={submitting || !baseInicial}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Abriendo caja...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-6 w-6 mr-2" />
                    Abrir Caja
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Enlace al historial */}
        <div className="text-center">
          <button
            onClick={() => setActivePage('Cierres de Caja')}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Ver historial de cierres de caja
          </button>
        </div>
      </div>
    </>
  );
};

export default AbrirCajaPage;
