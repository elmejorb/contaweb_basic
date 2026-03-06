import React, { useState, FC, useEffect, useMemo } from 'react';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, XIcon } from '../components/icons/IconComponents';
import { proveedorService, Proveedor as ApiProveedor } from '../services/proveedorService';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

interface PageProps {
  setActivePage: (page: string) => void;
}

// Modal Component
const SupplierModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
  supplier: Supplier | null;
}> = ({ isOpen, onClose, onSave, supplier }) => {
  const [formData, setFormData] = useState<Supplier | null>(null);
  const [nitDisplayValue, setNitDisplayValue] = useState('');
  const [isNitFocused, setIsNitFocused] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Función para formatear NIT con separadores de miles
  const formatearNitParaMostrar = (nit: string): string => {
    const nitLimpio = nit.replace(/\D/g, '');
    if (nitLimpio.length === 0) return '';
    return nitLimpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Función para validar email
  const validarEmail = (email: string): boolean => {
    if (!email) return true; // Email es opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    if (isOpen) {
      setErrors({}); // Limpiar errores al abrir el modal
      if (supplier) {
        const nitSinFormato = supplier.nit.replace(/\D/g, '');
        const dvCalculado = calcularDigitoVerificacion(nitSinFormato);
        setFormData({
          ...supplier,
          dv: dvCalculado
        });
        setNitDisplayValue(formatearNitParaMostrar(nitSinFormato));
      } else {
        setFormData({
          id: 0,
          codigo: '',
          razonSocial: '',
          nit: '',
          dv: '',
          email: '',
          telefono: '',
          direccion: '',
          contactoNombres: '',
          contactoApellidos: '',
          contactoTelefono: '',
          contactoDireccion: '',
          numeroCuentasBanco: '',
          status: 'Activo'
        });
        setNitDisplayValue('');
      }
    }
  }, [supplier, isOpen]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof Supplier, value: string | number | boolean) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field as string]) {
      const newErrors = { ...errors };
      delete newErrors[field as string];
      setErrors(newErrors);
    }
  };

  const handleNitChange = (value: string) => {
    if (!formData) return;
    const nitLimpio = value.replace(/\D/g, '');
    setNitDisplayValue(nitLimpio);
    const dv = calcularDigitoVerificacion(nitLimpio);
    setFormData({ ...formData, nit: nitLimpio, dv });

    // Limpiar error del NIT cuando el usuario empiece a escribir
    if (errors.nit) {
      const newErrors = { ...errors };
      delete newErrors.nit;
      setErrors(newErrors);
    }
  };

  const handleNitFocus = () => {
    setIsNitFocused(true);
    if (formData?.nit) {
      setNitDisplayValue(formData.nit.replace(/\D/g, ''));
    }
  };

  const handleNitBlur = () => {
    setIsNitFocused(false);
    if (formData?.nit) {
      const nitLimpio = formData.nit.replace(/\D/g, '');
      setNitDisplayValue(formatearNitParaMostrar(nitLimpio));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) return;

    // Validaciones
    const newErrors: { [key: string]: string } = {};

    // Razón Social es obligatoria
    if (!formData.razonSocial || formData.razonSocial.trim() === '') {
      newErrors.razonSocial = 'La razón social es obligatoria';
    }

    // NIT es obligatorio
    if (!formData.nit || formData.nit.trim() === '') {
      newErrors.nit = 'El NIT es obligatorio';
    }

    // Email debe ser válido si se proporciona
    if (formData.email && !validarEmail(formData.email)) {
      newErrors.email = 'El email no tiene un formato válido';
    }

    // Si hay errores, no continuar
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Limpiar errores y guardar
    setErrors({});
    onSave(formData);
  };

  const inputStyle = "block w-full px-2 py-1.5 bg-amber-50 border border-gray-300 rounded-md shadow-sm text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500";
  const labelStyle = "block text-xs font-medium text-gray-700 mb-0.5";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl" style={{ maxHeight: '95vh' }}>
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-lg">
          <h3 className="text-xl font-semibold text-white">
            {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-white hover:bg-white/20">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(95vh - 140px)' }}>
          {/* Información básica */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Razón Social *</label>
                <input
                  type="text"
                  value={formData.razonSocial}
                  onChange={(e) => handleChange('razonSocial', e.target.value)}
                  className={`${inputStyle} ${errors.razonSocial ? 'border-red-500' : ''}`}
                  required
                />
                {errors.razonSocial && (
                  <p className="text-red-500 text-xs mt-1">{errors.razonSocial}</p>
                )}
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-9">
                  <label className={labelStyle}>NIT *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={nitDisplayValue}
                    onChange={(e) => handleNitChange(e.target.value)}
                    onFocus={handleNitFocus}
                    onBlur={handleNitBlur}
                    onKeyPress={(e) => {
                      // Solo permitir números
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className={`${inputStyle} ${errors.nit ? 'border-red-500' : ''}`}
                    required
                    placeholder="Ej: 890926933"
                  />
                  {errors.nit && (
                    <p className="text-red-500 text-xs mt-1">{errors.nit}</p>
                  )}
                </div>
                <div className="col-span-3">
                  <label className={labelStyle}>DV</label>
                  <input
                    type="text"
                    value={formData.dv || ''}
                    readOnly
                    className="block w-full px-2 py-1.5 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-sm font-bold text-center text-gray-900 cursor-not-allowed"
                    placeholder="-"
                  />
                </div>
              </div>

              <div>
                <label className={labelStyle}>Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`${inputStyle} ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="ejemplo@correo.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className={labelStyle}>Teléfono</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  className={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Datos de contacto */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">Datos Contacto</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelStyle}>Nombres</label>
                <input
                  type="text"
                  value={formData.contactoNombres}
                  onChange={(e) => handleChange('contactoNombres', e.target.value)}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>Apellidos</label>
                <input
                  type="text"
                  value={formData.contactoApellidos}
                  onChange={(e) => handleChange('contactoApellidos', e.target.value)}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>Teléfono</label>
                <input
                  type="text"
                  value={formData.contactoTelefono}
                  onChange={(e) => handleChange('contactoTelefono', e.target.value)}
                  className={inputStyle}
                />
              </div>

              <div className="md:col-span-3">
                <label className={labelStyle}>Dirección</label>
                <input
                  type="text"
                  value={formData.contactoDireccion}
                  onChange={(e) => handleChange('contactoDireccion', e.target.value)}
                  className={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Número de cuentas de banco */}
          <div className="space-y-2">
            <div>
              <label className={labelStyle}>Nº de Cuentas de Banco</label>
              <textarea
                value={formData.numeroCuentasBanco}
                onChange={(e) => handleChange('numeroCuentasBanco', e.target.value)}
                className={inputStyle}
                rows={3}
              />
            </div>
          </div>
        </form>

        <div className="p-4 bg-gray-50 rounded-b-lg border-t flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

interface Supplier {
  id: number;
  codigo: string;
  razonSocial: string;
  nit: string;
  dv?: string;
  email: string;
  telefono: string;
  direccion: string;
  contactoNombres: string;
  contactoApellidos: string;
  contactoTelefono: string;
  contactoDireccion: string;
  numeroCuentasBanco: string;
  status: 'Activo' | 'Inactivo';
}

// Función para calcular el dígito de verificación según la DIAN (Colombia)
const calcularDigitoVerificacion = (nit: string): string => {
  // Remover caracteres no numéricos
  const nitLimpio = nit.replace(/\D/g, '');

  if (nitLimpio.length === 0) return '';

  const vpri = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let suma = 0;

  // Recorrer de derecha a izquierda
  for (let i = 0; i < nitLimpio.length && i < vpri.length; i++) {
    suma += parseInt(nitLimpio[nitLimpio.length - 1 - i]) * vpri[i];
  }

  const residuo = suma % 11;

  if (residuo === 0 || residuo === 1) {
    return String(residuo);
  }

  return String(11 - residuo);
}

const SuppliersPage: FC<PageProps> = ({ setActivePage }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  const { toasts, removeToast, success, error: showError } = useToast();

  // Obtener id_empresa de la empresa activa seleccionada
  const getUserEmpresa = () => {
    const empresaActivaId = localStorage.getItem('empresa_activa_id');
    if (empresaActivaId) {
      return parseInt(empresaActivaId);
    }
    // Fallback: obtener del user_data si no hay empresa activa
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id_empresa || 1;
    }
    return 1;
  };

  const convertApiSupplierToLocal = (apiSupplier: ApiProveedor): Supplier => {
    return {
      id: apiSupplier.id_proveedor,
      codigo: apiSupplier.codigo_proveedor || '',
      razonSocial: apiSupplier.razon_social,
      nit: apiSupplier.nit,
      email: apiSupplier.email || '',
      telefono: apiSupplier.telefono || '',
      direccion: apiSupplier.direccion || '',
      contactoNombres: apiSupplier.contacto_nombres || '',
      contactoApellidos: apiSupplier.contacto_apellidos || '',
      contactoTelefono: apiSupplier.contacto_telefono || '',
      contactoDireccion: apiSupplier.contacto_direccion || '',
      numeroCuentasBanco: apiSupplier.numero_cuentas_banco || '',
      status: apiSupplier.estado ? 'Activo' : 'Inactivo'
    };
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const id_empresa = getUserEmpresa();
      const response = await proveedorService.listar({
        page: currentPage,
        perPage: itemsPerPage,
        search: searchTerm || undefined,
        id_empresa,
        estado: 1
      });

      const suppliersData = response.proveedores.map(convertApiSupplierToLocal);
      setSuppliers(suppliersData);
      setTotalItems(response.total);
    } catch (err: any) {
      console.error('Error al cargar proveedores:', err);
      setError(err.mensaje || 'Error al cargar los proveedores');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [currentPage, searchTerm]);

  const handleSaveSupplier = async (supplierData: Supplier) => {
    if (!supplierData) return;

    try {
      const id_empresa = getUserEmpresa();
      const isNew = supplierData.id === 0;

      if (!supplierData.razonSocial || !supplierData.nit) {
        showError('La razón social y el NIT son obligatorios.');
        return;
      }

      const apiData = {
        id_empresa,
        razon_social: supplierData.razonSocial,
        nit: supplierData.nit,
        email: supplierData.email || undefined,
        telefono: supplierData.telefono || undefined,
        direccion: supplierData.direccion || undefined,
        contacto_nombres: supplierData.contactoNombres || undefined,
        contacto_apellidos: supplierData.contactoApellidos || undefined,
        contacto_telefono: supplierData.contactoTelefono || undefined,
        contacto_direccion: supplierData.contactoDireccion || undefined,
        numero_cuentas_banco: supplierData.numeroCuentasBanco || undefined,
        estado: supplierData.status === 'Activo'
      };

      if (isNew) {
        await proveedorService.crear(apiData);
        success('Proveedor creado exitosamente');
      } else {
        await proveedorService.actualizar(supplierData.id, apiData);
        success('Proveedor actualizado exitosamente');
      }

      fetchSuppliers();
      setIsModalOpen(false);
      setEditingSupplier(null);
    } catch (err: any) {
      console.error('Error al guardar proveedor:', err);
      showError(err.mensaje || 'Error al guardar el proveedor');
    }
  };

  const handleOpenModal = (supplier: Supplier | null) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleOpenDeleteModal = (supplier: Supplier) => {
    setDeletingSupplier(supplier);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingSupplier(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSupplier) return;

    try {
      await proveedorService.eliminar(deletingSupplier.id);
      success('Proveedor eliminado exitosamente');
      fetchSuppliers();
      handleCloseDeleteModal();
    } catch (err: any) {
      console.error('Error al eliminar proveedor:', err);
      showError(err.mensaje || 'Error al eliminar el proveedor');
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers;
  }, [suppliers]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

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
          <h1 className="text-3xl font-bold text-gray-800">Listado de Proveedores</h1>
          <button
            onClick={() => handleOpenModal(null)}
            className="flex items-center bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Proveedor
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por razón social, NIT o código..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="ml-3 text-gray-600">Cargando proveedores...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-600">
                      No se encontraron proveedores
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="bg-white hover:bg-gray-50">
                      <td className="border-t border-gray-200 px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-bold">{supplier.razonSocial}</div>
                        <div className="text-xs text-gray-500">
                          NIT: {supplier.nit}
                        </div>
                      </td>
                      <td className="border-t border-gray-200 px-4 py-3 text-gray-700 text-sm font-mono">
                        {supplier.codigo}
                      </td>
                      <td className="border-t border-gray-200 px-4 py-3 text-gray-700 text-sm">
                        {supplier.telefono || '-'}
                      </td>
                      <td className="border-t border-gray-200 px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenModal(supplier)}
                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          >
                            <EditIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(supplier)}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          >
                            <TrashIcon className="w-5 h-5" />
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
      </div>

      {/* Modal de Proveedor */}
      {isModalOpen && (
        <SupplierModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveSupplier}
          supplier={editingSupplier}
        />
      )}

      {/* Modal de eliminación */}
      {isDeleteModalOpen && deletingSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 bg-red-600 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white">Eliminar Proveedor</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                ¿Está seguro que desea eliminar el proveedor{' '}
                <span className="font-bold">{deletingSupplier.razonSocial}</span>?
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex items-center bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SuppliersPage;
