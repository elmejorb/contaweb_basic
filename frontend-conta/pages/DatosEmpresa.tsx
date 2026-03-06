import React, { useState, useEffect } from 'react';
import { empresaService, Empresa, CrearEmpresaData } from '../src/services/empresaService';
import { HomeIcon, SaveIcon, RefreshIcon } from '../components/icons/IconComponents';
import { SERVER_URL } from '../services/authService';

const DatosEmpresa: React.FC = () => {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [formData, setFormData] = useState<CrearEmpresaData>({
    nombre_empresa: '',
    nit_empresa: '',
    telefono_empresa: '',
    direccion_empresa: '',
    email_empresa: '',
    descripcion_empresa: '',
    regimen_empresa: 'Simplificado'
  });
  const [errors, setErrors] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    cargarEmpresaActiva();
  }, []);

  const cargarEmpresaActiva = async () => {
    try {
      setLoading(true);
      const empresaActivaId = localStorage.getItem('empresa_activa_id');

      if (!empresaActivaId) {
        setErrors({ general: 'No hay empresa activa seleccionada. Por favor selecciona una empresa desde el selector en el navbar.' });
        setLoading(false);
        return;
      }

      const data = await empresaService.obtener(parseInt(empresaActivaId));
      setEmpresa(data);
      setFormData({
        nombre_empresa: data.nombre_empresa,
        nit_empresa: data.nit_empresa,
        telefono_empresa: data.telefono_empresa || '',
        direccion_empresa: data.direccion_empresa || '',
        email_empresa: data.email_empresa || '',
        descripcion_empresa: data.descripcion_empresa || '',
        regimen_empresa: data.regimen_empresa || 'Simplificado',
        resolucion_facturacion: data.resolucion_facturacion || '',
        fecha_resolucion: data.fecha_resolucion || '',
        prefijo_factura: data.prefijo_factura || '',
        rango_desde: data.rango_desde,
        rango_hasta: data.rango_hasta
      });
    } catch (error: any) {
      console.error('Error al cargar empresa:', error);
      setErrors({ general: 'Error al cargar los datos de la empresa' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!empresa) return;

    setErrors({});
    setSuccessMessage('');
    setSaving(true);

    try {
      await empresaService.actualizar(empresa.id_empresa, formData);
      setSuccessMessage('Datos actualizados exitosamente');

      // Recargar los datos actualizados
      await cargarEmpresaActiva();

      // Disparar evento para que el CompanySelector recargue las empresas
      window.dispatchEvent(new Event('reload-empresas'));

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      if (error.response?.data?.errores) {
        setErrors(error.response.data.errores);
      } else {
        setErrors({ general: error.response?.data?.mensaje || 'Error al actualizar los datos' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CrearEmpresaData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!empresa || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ logo: 'El archivo debe ser menor a 2MB' });
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setErrors({ logo: 'El archivo debe ser una imagen' });
      return;
    }

    try {
      setUploadingLogo(true);
      setErrors({});
      await empresaService.subirLogo(empresa.id_empresa, file);
      setSuccessMessage('Logo actualizado exitosamente');

      // Recargar datos de la empresa
      await cargarEmpresaActiva();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrors({ logo: error.response?.data?.mensaje || 'Error al subir el logo' });
    } finally {
      setUploadingLogo(false);
      // Limpiar el input
      e.target.value = '';
    }
  };

  const handleEliminarLogo = async () => {
    if (!empresa) return;

    if (!confirm('¿Estás seguro de eliminar el logo de la empresa?')) {
      return;
    }

    try {
      setUploadingLogo(true);
      await empresaService.eliminarLogo(empresa.id_empresa);
      setSuccessMessage('Logo eliminado exitosamente');

      // Recargar datos de la empresa
      await cargarEmpresaActiva();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrors({ logo: error.response?.data?.mensaje || 'Error al eliminar el logo' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSincronizarCRM = async () => {
    if (!empresa) return;

    if (!empresa.token_crm) {
      setErrors({ crm: 'Esta empresa no tiene un token CRM asociado' });
      return;
    }

    try {
      setSincronizando(true);
      setErrors({});
      const resultado = await empresaService.sincronizarConCRM(empresa.id_empresa);

      setSuccessMessage(`Sincronización exitosa. Plan: ${resultado.empresa.plan_actual}. ${resultado.empresa.dias_restantes ? `Días restantes: ${resultado.empresa.dias_restantes}` : ''}`);

      // Recargar datos de la empresa
      await cargarEmpresaActiva();

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      setErrors({ crm: error.response?.data?.mensaje || 'Error al sincronizar con el CRM' });
    } finally {
      setSincronizando(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-lg text-gray-600">Cargando datos de la empresa...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <HomeIcon className="h-16 w-16 mx-auto text-amber-400 mb-4" />
          <h3 className="text-lg font-semibold text-amber-900 mb-2">No hay empresa activa</h3>
          <p className="text-amber-700">
            Por favor selecciona una empresa desde el selector en el navbar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <HomeIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Datos de la Empresa</h1>
            <p className="text-sm text-gray-500 mt-1">
              Edita la información de tu empresa activa
            </p>
          </div>
        </div>

        {empresa.codigo_empresa && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500">Código de Empresa</span>
                <p className="text-sm font-mono text-gray-800 mt-1">{empresa.codigo_empresa}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-gray-500">ID</span>
                <p className="text-sm font-mono text-gray-800 mt-1">#{empresa.id_empresa}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errors.general && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {errors.general}
        </div>
      )}

      {/* Logo de la Empresa */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Logo de la Empresa</h3>

        <div className="flex items-start space-x-6">
          {/* Preview del Logo */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
              {empresa?.logo_empresa ? (
                <img
                  src={`${SERVER_URL}${empresa.logo_empresa}`}
                  alt="Logo de la empresa"
                  className="w-full h-full object-contain"
                />
              ) : (
                <HomeIcon className="h-16 w-16 text-gray-400" />
              )}
            </div>
          </div>

          {/* Controles */}
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-4">
              Sube el logo de tu empresa. Recomendamos una imagen cuadrada de al menos 200x200 píxeles.
            </p>

            {errors.logo && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {errors.logo}
              </div>
            )}

            <div className="flex space-x-3">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={uploadingLogo}
                  className="hidden"
                />
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {uploadingLogo ? 'Subiendo...' : 'Subir Logo'}
              </label>

              {empresa?.logo_empresa && (
                <button
                  type="button"
                  onClick={handleEliminarLogo}
                  disabled={uploadingLogo}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Eliminar Logo
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Formatos permitidos: JPG, PNG, GIF, SVG. Tamaño máximo: 2MB
            </p>
          </div>
        </div>
      </div>

      {/* Información del CRM */}
      
      {empresa.token_crm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Suscripción CRM</h3>
            <button
              type="button"
              onClick={handleSincronizarCRM}
              disabled={sincronizando}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshIcon className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} />
              <span>{sincronizando ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
          </div>

          {errors.crm && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.crm}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <p className="text-xs font-medium text-purple-600 mb-1">Plan Actual</p>
              <p className="text-lg font-bold text-purple-900">{empresa.plan_actual || 'No asignado'}</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <p className="text-xs font-medium text-green-600 mb-1">Estado</p>
              <p className="text-lg font-bold text-green-900 capitalize">
                {empresa.estado_suscripcion === 'activo' ? '✓ Activo' : empresa.estado_suscripcion || 'Desconocido'}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <p className="text-xs font-medium text-blue-600 mb-1">Vence</p>
              <p className="text-sm font-bold text-blue-900">
                {empresa.fecha_vencimiento_plan
                  ? new Date(empresa.fecha_vencimiento_plan).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'N/A'}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <p className="text-xs font-medium text-amber-600 mb-1">Última Sincronización</p>
              <p className="text-xs font-semibold text-amber-900">
                {empresa.ultima_validacion_crm
                  ? new Date(empresa.ultima_validacion_crm).toLocaleString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Nunca'}
              </p>
            </div>
          </div>

          {empresa.modulos_habilitados && empresa.modulos_habilitados.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Módulos Habilitados:</p>
              <div className="flex flex-wrap gap-2">
                {empresa.modulos_habilitados.map((modulo, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full border border-indigo-300"
                  >
                    {modulo.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">
              <strong>Nota:</strong> La sincronización actualiza automáticamente el plan, módulos y fecha de vencimiento desde el CRM.
              Sincroniza periódicamente para mantener actualizados los permisos de acceso.
            </p>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Nombre de la Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Empresa *
            </label>
            <input
              type="text"
              value={formData.nombre_empresa}
              onChange={(e) => handleChange('nombre_empresa', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              disabled={saving}
            />
            {errors.nombre_empresa && (
              <p className="text-red-500 text-xs mt-1">{errors.nombre_empresa[0]}</p>
            )}
          </div>

          {/* NIT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NIT *
            </label>
            <input
              type="text"
              value={formData.nit_empresa}
              onChange={(e) => handleChange('nit_empresa', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              disabled={saving}
            />
            {errors.nit_empresa && (
              <p className="text-red-500 text-xs mt-1">{errors.nit_empresa[0]}</p>
            )}
          </div>

          {/* Token CRM - Solo lectura */}
          {empresa.token_crm && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token CRM
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={empresa.token_crm}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed font-mono text-sm"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                    CRM
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Este token vincula la empresa con el CRM y no puede ser modificado manualmente.
              </p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email_empresa}
              onChange={(e) => handleChange('email_empresa', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={saving}
            />
            {errors.email_empresa && (
              <p className="text-red-500 text-xs mt-1">{errors.email_empresa[0]}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="text"
              value={formData.telefono_empresa}
              onChange={(e) => handleChange('telefono_empresa', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={saving}
            />
            {errors.telefono_empresa && (
              <p className="text-red-500 text-xs mt-1">{errors.telefono_empresa[0]}</p>
            )}
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <textarea
              value={formData.direccion_empresa}
              onChange={(e) => handleChange('direccion_empresa', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={saving}
            />
            {errors.direccion_empresa && (
              <p className="text-red-500 text-xs mt-1">{errors.direccion_empresa[0]}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción de la Empresa
            </label>
            <textarea
              value={formData.descripcion_empresa || ''}
              onChange={(e) => handleChange('descripcion_empresa', e.target.value)}
              rows={3}
              placeholder="Describe brevemente la actividad o naturaleza de tu empresa..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={saving}
            />
            {errors.descripcion_empresa && (
              <p className="text-red-500 text-xs mt-1">{errors.descripcion_empresa[0]}</p>
            )}
          </div>

          {/* Régimen Tributario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Régimen Tributario *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleChange('regimen_empresa', 'Simplificado')}
                disabled={saving}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                  formData.regimen_empresa === 'Simplificado'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="text-center">
                  <div className="font-semibold">Régimen Simplificado</div>
                  <div className="text-xs mt-1 opacity-75">No declara IVA</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleChange('regimen_empresa', 'Comun')}
                disabled={saving}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                  formData.regimen_empresa === 'Comun'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="text-center">
                  <div className="font-semibold">Régimen Común</div>
                  <div className="text-xs mt-1 opacity-75">Declara IVA</div>
                </div>
              </button>
            </div>
            {errors.regimen_empresa && (
              <p className="text-red-500 text-xs mt-1">{errors.regimen_empresa[0]}</p>
            )}
          </div>

          {/* Datos de Facturación - Solo para Régimen Común */}
          {formData.regimen_empresa === 'Comun' && (
            <div className="border-t border-gray-200 pt-6 space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-900 text-sm mb-1">
                  📋 Datos de Facturación Electrónica
                </h4>
                <p className="text-xs text-indigo-700">
                  Estos campos son obligatorios para empresas de Régimen Común que emiten facturas con IVA
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resolución de Facturación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolución de Facturación *
                  </label>
                  <input
                    type="text"
                    value={formData.resolucion_facturacion || ''}
                    onChange={(e) => handleChange('resolucion_facturacion', e.target.value)}
                    placeholder="Ej: 18760000001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={saving}
                    required={formData.regimen_empresa === 'Comun'}
                  />
                  {errors.resolucion_facturacion && (
                    <p className="text-red-500 text-xs mt-1">{errors.resolucion_facturacion[0]}</p>
                  )}
                </div>

                {/* Fecha de Resolución */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Resolución *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_resolucion || ''}
                    onChange={(e) => handleChange('fecha_resolucion', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={saving}
                    required={formData.regimen_empresa === 'Comun'}
                  />
                  {errors.fecha_resolucion && (
                    <p className="text-red-500 text-xs mt-1">{errors.fecha_resolucion[0]}</p>
                  )}
                </div>

                {/* Prefijo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prefijo de Factura *
                  </label>
                  <input
                    type="text"
                    value={formData.prefijo_factura || ''}
                    onChange={(e) => handleChange('prefijo_factura', e.target.value.toUpperCase())}
                    placeholder="Ej: FACT, FE, POS"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase"
                    disabled={saving}
                    maxLength={10}
                    required={formData.regimen_empresa === 'Comun'}
                  />
                  {errors.prefijo_factura && (
                    <p className="text-red-500 text-xs mt-1">{errors.prefijo_factura[0]}</p>
                  )}
                </div>

                {/* Rango Desde */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rango Desde *
                  </label>
                  <input
                    type="number"
                    value={formData.rango_desde || ''}
                    onChange={(e) => handleChange('rango_desde', e.target.value)}
                    placeholder="Ej: 1"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={saving}
                    required={formData.regimen_empresa === 'Comun'}
                  />
                  {errors.rango_desde && (
                    <p className="text-red-500 text-xs mt-1">{errors.rango_desde[0]}</p>
                  )}
                </div>

                {/* Rango Hasta */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rango Hasta *
                  </label>
                  <input
                    type="number"
                    value={formData.rango_hasta || ''}
                    onChange={(e) => handleChange('rango_hasta', e.target.value)}
                    placeholder="Ej: 10000"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={saving}
                    required={formData.regimen_empresa === 'Comun'}
                  />
                  {errors.rango_hasta && (
                    <p className="text-red-500 text-xs mt-1">{errors.rango_hasta[0]}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={cargarEmpresaActiva}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshIcon className="h-4 w-4" />
            <span>Recargar</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SaveIcon className="h-4 w-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>

      {/* Información Adicional */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2 text-sm">💡 Información Importante</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Los cambios afectarán solo a la empresa actualmente seleccionada</li>
          <li>El NIT debe ser único en el sistema</li>
          <li>Los campos marcados con * son obligatorios</li>
          <li><strong>Régimen Simplificado:</strong> No declara IVA, las facturas no incluirán IVA</li>
          <li><strong>Régimen Común:</strong> Declara IVA, las facturas deben incluir el IVA correspondiente y los datos de facturación electrónica son obligatorios</li>
        </ul>
      </div>
    </div>
  );
};

export default DatosEmpresa;
