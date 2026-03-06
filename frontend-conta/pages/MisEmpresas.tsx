import React, { useState, useEffect } from 'react';
import { empresaService, Empresa, CrearEmpresaData } from '../src/services/empresaService';
import { HomeIcon, PlusIcon, EditIcon, LockClosedIcon, XIcon } from '../components/icons/IconComponents';

interface MisEmpresasProps {
  setActivePage: (page: string) => void;
}

const MisEmpresas: React.FC<MisEmpresasProps> = ({ setActivePage }) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'editar'>('crear');
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ token_api: string; codigo_empresa: string } | null>(null);
  const [formData, setFormData] = useState<CrearEmpresaData>({
    nombre_empresa: '',
    nit_empresa: '',
    telefono_empresa: '',
    direccion_empresa: '',
    email_empresa: ''
  });
  const [errors, setErrors] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    try {
      setLoading(true);
      const data = await empresaService.misEmpresas();
      setEmpresas(data);
    } catch (error) {
      console.error('Error al cargar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode: 'crear' | 'editar', empresa?: Empresa) => {
    setModalMode(mode);
    if (mode === 'editar' && empresa) {
      setEmpresaSeleccionada(empresa);
      setFormData({
        nombre_empresa: empresa.nombre_empresa,
        nit_empresa: empresa.nit_empresa,
        telefono_empresa: empresa.telefono_empresa || '',
        direccion_empresa: empresa.direccion_empresa || '',
        email_empresa: empresa.email_empresa || ''
      });
    } else {
      setEmpresaSeleccionada(null);
      setFormData({
        nombre_empresa: '',
        nit_empresa: '',
        telefono_empresa: '',
        direccion_empresa: '',
        email_empresa: ''
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEmpresaSeleccionada(null);
    setFormData({
      nombre_empresa: '',
      nit_empresa: '',
      telefono_empresa: '',
      direccion_empresa: '',
      email_empresa: ''
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    try {
      if (modalMode === 'crear') {
        await empresaService.crear(formData);
        setSuccessMessage('Empresa creada exitosamente');
      } else if (empresaSeleccionada) {
        await empresaService.actualizar(empresaSeleccionada.id_empresa, formData);
        setSuccessMessage('Empresa actualizada exitosamente');
      }

      handleCloseModal();
      cargarEmpresas();

      // Disparar evento para que el CompanySelector recargue las empresas
      window.dispatchEvent(new Event('reload-empresas'));

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      if (error.response?.data?.errores) {
        setErrors(error.response.data.errores);
      } else {
        setErrors({ general: error.response?.data?.mensaje || 'Error al procesar la solicitud' });
      }
    }
  };

  const handleVerToken = async (empresa: Empresa) => {
    try {
      const data = await empresaService.obtenerToken(empresa.id_empresa);
      setTokenInfo(data);
      setEmpresaSeleccionada(empresa);
      setShowTokenModal(true);
    } catch (error) {
      console.error('Error al obtener token:', error);
    }
  };

  const handleRegenerarToken = async () => {
    if (!empresaSeleccionada) return;

    if (!confirm('¿Está seguro de regenerar el token? El token anterior dejará de funcionar.')) {
      return;
    }

    try {
      const nuevoToken = await empresaService.regenerarToken(empresaSeleccionada.id_empresa);
      setTokenInfo(prev => prev ? { ...prev, token_api: nuevoToken } : null);
      setSuccessMessage('Token regenerado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error al regenerar token:', error);
    }
  };

  const handleCopyToken = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('Copiado al portapapeles');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Empresas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra las empresas asociadas a tu cuenta
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActivePage('Registrar Empresa CRM')}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Con Token CRM</span>
          </button>
          <button
            onClick={() => handleOpenModal('crear')}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nueva Empresa</span>
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}

      {/* Lista de Empresas */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-lg text-gray-600">Cargando empresas...</span>
          </div>
        </div>
      ) : empresas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <HomeIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No tienes empresas registradas</h3>
          <p className="text-gray-500 mb-4">Comienza creando tu primera empresa</p>
          <button
            onClick={() => handleOpenModal('crear')}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Crear Empresa</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresas.map((empresa) => (
            <div
              key={empresa.id_empresa}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <HomeIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{empresa.nombre_empresa}</h3>
                    {empresa.codigo_empresa && (
                      <span className="text-xs text-gray-500 font-mono">{empresa.codigo_empresa}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <span className="text-xs text-gray-500">NIT:</span>
                  <p className="text-sm text-gray-700">{empresa.nit_empresa}</p>
                </div>
                {empresa.email_empresa && (
                  <div>
                    <span className="text-xs text-gray-500">Email:</span>
                    <p className="text-sm text-gray-700">{empresa.email_empresa}</p>
                  </div>
                )}
                {empresa.telefono_empresa && (
                  <div>
                    <span className="text-xs text-gray-500">Teléfono:</span>
                    <p className="text-sm text-gray-700">{empresa.telefono_empresa}</p>
                  </div>
                )}
                {empresa.direccion_empresa && (
                  <div>
                    <span className="text-xs text-gray-500">Dirección:</span>
                    <p className="text-sm text-gray-700">{empresa.direccion_empresa}</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleOpenModal('editar', empresa)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  <EditIcon className="h-4 w-4" />
                  <span className="text-sm">Editar</span>
                </button>
                <button
                  onClick={() => handleVerToken(empresa)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                >
                  <LockClosedIcon className="h-4 w-4" />
                  <span className="text-sm">Token</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {modalMode === 'crear' ? 'Crear Nueva Empresa' : 'Editar Empresa'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {errors.general}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_empresa}
                    onChange={(e) => setFormData({ ...formData, nombre_empresa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  {errors.nombre_empresa && (
                    <p className="text-red-500 text-xs mt-1">{errors.nombre_empresa[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIT *
                  </label>
                  <input
                    type="text"
                    value={formData.nit_empresa}
                    onChange={(e) => setFormData({ ...formData, nit_empresa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  {errors.nit_empresa && (
                    <p className="text-red-500 text-xs mt-1">{errors.nit_empresa[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email_empresa}
                    onChange={(e) => setFormData({ ...formData, email_empresa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.email_empresa && (
                    <p className="text-red-500 text-xs mt-1">{errors.email_empresa[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono_empresa}
                    onChange={(e) => setFormData({ ...formData, telefono_empresa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.telefono_empresa && (
                    <p className="text-red-500 text-xs mt-1">{errors.telefono_empresa[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    value={formData.direccion_empresa}
                    onChange={(e) => setFormData({ ...formData, direccion_empresa: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.direccion_empresa && (
                    <p className="text-red-500 text-xs mt-1">{errors.direccion_empresa[0]}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {modalMode === 'crear' ? 'Crear Empresa' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Token */}
      {showTokenModal && tokenInfo && empresaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Token de API</h2>
                <p className="text-sm text-gray-500 mt-1">{empresaSeleccionada.nombre_empresa}</p>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Empresa
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm">
                    {tokenInfo.codigo_empresa}
                  </code>
                  <button
                    onClick={() => handleCopyToken(tokenInfo.codigo_empresa)}
                    className="px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token API
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm break-all">
                    {tokenInfo.token_api}
                  </code>
                  <button
                    onClick={() => handleCopyToken(tokenInfo.token_api)}
                    className="px-4 py-3 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    Copiar
                  </button>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ Este token es confidencial. No lo compartas públicamente.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Uso en Visual Basic 6</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Utiliza estos valores para sincronizar datos desde tu aplicación VB6:
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Código de empresa para el campo <code>id_empresa</code></li>
                  <li>Token API para autenticación en las peticiones</li>
                </ul>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handleRegenerarToken}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Regenerar Token
                </button>
                <button
                  onClick={() => setShowTokenModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisEmpresas;
