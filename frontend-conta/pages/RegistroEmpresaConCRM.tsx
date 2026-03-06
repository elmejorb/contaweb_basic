import React, { useState } from 'react';
import crmService, { ValidacionTokenResponse } from '../services/crmService';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

interface RegistroEmpresaConCRMProps {
  setActivePage: (page: string) => void;
}

const RegistroEmpresaConCRM: React.FC<RegistroEmpresaConCRMProps> = ({ setActivePage }) => {
  const [paso, setPaso] = useState(1); // 1: Validar Token, 2: Completar Datos
  const [tokenCRM, setTokenCRM] = useState('');
  const [validando, setValidando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [datosValidacion, setDatosValidacion] = useState<ValidacionTokenResponse | null>(null);

  // Datos de la empresa
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [nitEmpresa, setNitEmpresa] = useState('');
  const [telefonoEmpresa, setTelefonoEmpresa] = useState('');
  const [direccionEmpresa, setDireccionEmpresa] = useState('');
  const [emailEmpresa, setEmailEmpresa] = useState('');

  const { toasts, removeToast, success, error: showError } = useToast();

  const handleValidarToken = async () => {
    if (!tokenCRM.trim()) {
      showError('Por favor ingresa el token del CRM');
      return;
    }

    setValidando(true);
    try {
      const resultado = await crmService.validarToken(tokenCRM);

      if (resultado.error) {
        showError(resultado.mensaje || 'Token inválido');
        return;
      }

      // Token válido, prellenar datos del cliente
      if (resultado.cliente) {
        setNombreEmpresa(resultado.cliente.empresa || '');
        setNitEmpresa(resultado.cliente.nit || '');
        setTelefonoEmpresa(resultado.cliente.telefono || '');
        setEmailEmpresa(resultado.cliente.email || '');
      }

      setDatosValidacion(resultado);
      success('Token válido. Completa los datos de tu empresa.');
      setPaso(2);
    } catch (err: any) {
      showError(err.mensaje || 'Error al validar el token');
    } finally {
      setValidando(false);
    }
  };

  const handleCrearEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombreEmpresa || !nitEmpresa) {
      showError('Completa los campos obligatorios');
      return;
    }

    setCreando(true);
    try {
      const resultado = await crmService.crearEmpresaConCRM({
        token_crm: tokenCRM,
        nombre_empresa: nombreEmpresa,
        nit_empresa: nitEmpresa,
        telefono_empresa: telefonoEmpresa,
        direccion_empresa: direccionEmpresa,
        email_empresa: emailEmpresa
      });

      if (resultado.error) {
        showError(resultado.mensaje || 'Error al crear empresa');
        return;
      }

      success('Empresa creada exitosamente');

      // Actualizar localStorage con la empresa creada
      const empresaActual = {
        id_empresa: resultado.empresa.id_empresa,
        nombre_empresa: resultado.empresa.nombre_empresa,
        nit_empresa: resultado.empresa.nit_empresa,
        modulos_habilitados: resultado.empresa.modulos_habilitados
      };
      localStorage.setItem('empresaActual', JSON.stringify(empresaActual));

      // Redirigir a Mis Empresas
      setTimeout(() => {
        setActivePage('Mis Empresas');
      }, 2000);
    } catch (err: any) {
      showError(err.mensaje || 'Error al crear empresa');
    } finally {
      setCreando(false);
    }
  };

  const handleVolver = () => {
    setPaso(1);
    setDatosValidacion(null);
  };

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

      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Registrar Empresa con CRM</h1>
          <p className="text-gray-600 mt-2">
            Valida tu token del CRM y registra tu empresa para acceder al sistema
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                paso >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Validar Token</span>
            </div>
            <div className={`w-24 h-1 mx-4 ${paso >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                paso >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">Datos Empresa</span>
            </div>
          </div>
        </div>

        {/* Paso 1: Validar Token */}
        {paso === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Paso 1: Valida tu Token</h2>
            <p className="text-gray-600 mb-6">
              Ingresa el token que recibiste del sistema CRM para validar tu suscripción
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token del CRM <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tokenCRM}
                  onChange={(e) => setTokenCRM(e.target.value)}
                  placeholder="Ej: a1b2c3d4e5f6..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleValidarToken}
                  disabled={validando || !tokenCRM.trim()}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                    validando || !tokenCRM.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {validando ? 'Validando...' : 'Validar Token'}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePage('Mis Empresas')}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>¿No tienes un token?</strong> Contacta con nuestro equipo de ventas para obtener tu suscripción.
              </p>
            </div>
          </div>
        )}

        {/* Paso 2: Completar Datos de la Empresa */}
        {paso === 2 && datosValidacion && (
          <div className="space-y-6">
            {/* Información del Plan */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Información de tu Suscripción</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="text-lg font-semibold text-gray-800">{datosValidacion.suscripcion?.plan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                    crmService.getColorEstado(datosValidacion.suscripcion?.estado || 'inactivo')
                  }`}>
                    {datosValidacion.suscripcion?.estado.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vence</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(datosValidacion.suscripcion?.fecha_vencimiento || '').toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>

              {datosValidacion.modulos_habilitados && datosValidacion.modulos_habilitados.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Módulos incluidos:</p>
                  <div className="flex flex-wrap gap-2">
                    {datosValidacion.modulos_habilitados.map((modulo) => (
                      <span
                        key={modulo}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full"
                      >
                        {crmService.getNombreModulo(modulo)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Formulario de Datos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Paso 2: Completa los Datos</h2>

              <form onSubmit={handleCrearEmpresa} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Empresa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nombreEmpresa}
                      onChange={(e) => setNombreEmpresa(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIT <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nitEmpresa}
                      onChange={(e) => setNitEmpresa(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={telefonoEmpresa}
                      onChange={(e) => setTelefonoEmpresa(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={emailEmpresa}
                      onChange={(e) => setEmailEmpresa(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <textarea
                    value={direccionEmpresa}
                    onChange={(e) => setDireccionEmpresa(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleVolver}
                    disabled={creando}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={creando}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      creando
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {creando ? 'Creando Empresa...' : 'Crear Empresa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RegistroEmpresaConCRM;
