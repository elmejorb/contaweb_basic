import React, { useState, FC, useEffect, useMemo } from 'react';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, XIcon } from '../components/icons/IconComponents';
import { clienteService, Cliente as ApiCliente } from '../services/clienteService';
import { catalogoService, TipoDocumento, TipoResponsabilidad, TipoOrganizacion, TipoRegimen } from '../services/catalogoService';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

interface PageProps {
  setActivePage: (page: string) => void;
}

// Modal Component
const CustomerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customer: Customer | null;
}> = ({ isOpen, onClose, onSave, customer }) => {
  const [formData, setFormData] = useState<Customer | null>(null);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [tiposResponsabilidad, setTiposResponsabilidad] = useState<TipoResponsabilidad[]>([]);
  const [tiposOrganizacion, setTiposOrganizacion] = useState<TipoOrganizacion[]>([]);
  const [regimenesTributarios, setRegimenesTributarios] = useState<TipoRegimen[]>([]);

  // Cargar catálogos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadCatalogos();
    }
  }, [isOpen]);

  // Inicializar datos del formulario
  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData(customer);
      } else {
        setFormData({
          id: 0,
          codigo: '',
          nombreRazonSocial: '',
          tipoDocumento: '',
          numeroDocumento: '',
          digitoVerificacion: '',
          telefono: '',
          celular: '',
          whatsapp: '',
          email: '',
          direccion: '',
          departamento: '',
          municipio: '',
          fechaNacimiento: '',
          tipoResponsabilidad: '',
          tipoAdquiriente: '',
          regimenTributario: '',
          contactoNombres: '',
          contactoApellidos: '',
          contactoTelefono: '',
          contactoDireccion: '',
          cupoAutorizado: 0,
          idVendedor: undefined,
          facturaPrecioCosto: false,
          facturarConVencimientos: false,
          facturarSoloContado: false,
          status: 'Activo'
        });
      }
    }
  }, [customer, isOpen]);

  const loadCatalogos = async () => {
    try {
      const catalogos = await catalogoService.todos();
      setTiposDocumento(catalogos.tipos_documentos);
      setTiposResponsabilidad(catalogos.tipos_responsabilidades);
      setTiposOrganizacion(catalogos.tipos_organizaciones);
      setRegimenesTributarios(catalogos.regimenes_tributarios);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    }
  };

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof Customer, value: string | number | boolean) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
    }
  };

  const inputStyle = "block w-full px-2 py-1.5 bg-amber-50 border border-gray-300 rounded-md shadow-sm text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500";
  const labelStyle = "block text-xs font-medium text-gray-700 mb-0.5";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl" style={{ maxHeight: '95vh' }}>
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-lg">
          <h3 className="text-xl font-semibold text-white">
            {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-white hover:bg-white/20">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(95vh - 140px)' }}>
          {/* Información básica */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6">
                <label className={labelStyle}>Nombre o Razón Social *</label>
                <input
                  type="text"
                  value={formData.nombreRazonSocial}
                  onChange={(e) => handleChange('nombreRazonSocial', e.target.value)}
                  className={inputStyle}
                  required
                />
              </div>

              <div className="col-span-3">
                <label className={labelStyle}>Tipo de Documento *</label>
                <select
                  value={formData.tipoDocumento}
                  onChange={(e) => handleChange('tipoDocumento', e.target.value)}
                  className={inputStyle}
                  required
                >
                  <option value="">Seleccione...</option>
                  {tiposDocumento.map(tipo => (
                    <option key={tipo.code} value={tipo.code}>{tipo.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <label className={labelStyle}>Número de Documento *</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.numeroDocumento}
                    onChange={(e) => handleChange('numeroDocumento', e.target.value)}
                    className={`${inputStyle} flex-1`}
                    required
                  />
                  {formData.tipoDocumento === 'NIT' && (
                    <input
                      type="text"
                      value={formData.digitoVerificacion}
                      onChange={(e) => handleChange('digitoVerificacion', e.target.value)}
                      className={`${inputStyle} w-14`}
                      placeholder="DV"
                      maxLength={2}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <label className={labelStyle}>Celular</label>
                <input
                  type="text"
                  value={formData.celular}
                  onChange={(e) => handleChange('celular', e.target.value)}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>WhatsApp</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>E-Mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
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

              <div>
                <label className={labelStyle}>Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                  className={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Datos fiscales */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelStyle}>Tipo Responsabilidad</label>
                <select
                  value={formData.tipoResponsabilidad}
                  onChange={(e) => handleChange('tipoResponsabilidad', e.target.value)}
                  className={inputStyle}
                >
                  <option value="">Seleccione...</option>
                  {tiposResponsabilidad.map(tipo => (
                    <option key={tipo.code} value={tipo.code}>{tipo.code} - {tipo.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelStyle}>Tipo de Adquiriente</label>
                <select
                  value={formData.tipoAdquiriente}
                  onChange={(e) => handleChange('tipoAdquiriente', e.target.value)}
                  className={inputStyle}
                >
                  <option value="">Seleccione...</option>
                  {tiposOrganizacion.map(tipo => (
                    <option key={tipo.code} value={tipo.code}>{tipo.code} - {tipo.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelStyle}>Régimen Tributario</label>
                <select
                  value={formData.regimenTributario}
                  onChange={(e) => handleChange('regimenTributario', e.target.value)}
                  className={inputStyle}
                >
                  <option value="">Seleccione...</option>
                  {regimenesTributarios.map(regimen => (
                    <option key={regimen.code} value={regimen.code}>{regimen.code} - {regimen.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Datos de contacto adicional */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

              <div>
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

          {/* Datos comerciales */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Cupo Autorizado</label>
                <input
                  type="number"
                  value={formData.cupoAutorizado}
                  onChange={(e) => handleChange('cupoAutorizado', parseFloat(e.target.value) || 0)}
                  className={inputStyle}
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.facturaPrecioCosto}
                    onChange={(e) => handleChange('facturaPrecioCosto', e.target.checked)}
                    className="mr-1.5 h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-700">Factura a Precio Costo</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.facturarConVencimientos}
                    onChange={(e) => handleChange('facturarConVencimientos', e.target.checked)}
                    className="mr-1.5 h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-700">Facturar con Vencimientos</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.facturarSoloContado}
                    onChange={(e) => handleChange('facturarSoloContado', e.target.checked)}
                    className="mr-1.5 h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-700">Facturar solo al Contado</span>
                </label>
              </div>
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

interface Customer {
  id: number;
  codigo: string;
  nombreRazonSocial: string;
  tipoDocumento: string;
  numeroDocumento: string;
  digitoVerificacion: string;
  telefono: string;
  celular: string;
  whatsapp: string;
  email: string;
  direccion: string;
  departamento: string;
  municipio: string;
  fechaNacimiento: string;
  tipoResponsabilidad: string;
  tipoAdquiriente: string;
  regimenTributario: string;
  contactoNombres: string;
  contactoApellidos: string;
  contactoTelefono: string;
  contactoDireccion: string;
  cupoAutorizado: number;
  idVendedor?: number;
  facturaPrecioCosto: boolean;
  facturarConVencimientos: boolean;
  facturarSoloContado: boolean;
  status: 'Activo' | 'Inactivo';
}

const CustomersPage: FC<PageProps> = ({ setActivePage }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

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

  const convertApiCustomerToLocal = (apiCustomer: ApiCliente): Customer => {
    // Convertir fecha de formato ISO a YYYY-MM-DD
    let fechaNacimiento = '';
    if (apiCustomer.fecha_nacimiento) {
      const fecha = new Date(apiCustomer.fecha_nacimiento);
      if (!isNaN(fecha.getTime())) {
        fechaNacimiento = fecha.toISOString().split('T')[0];
      }
    }

    return {
      id: apiCustomer.id_cliente,
      codigo: apiCustomer.codigo_cliente || '',
      nombreRazonSocial: apiCustomer.nombre_razon_social,
      tipoDocumento: apiCustomer.tipo_documento,
      numeroDocumento: apiCustomer.numero_documento,
      digitoVerificacion: apiCustomer.digito_verificacion || '',
      telefono: apiCustomer.telefono || '',
      celular: apiCustomer.celular || '',
      whatsapp: apiCustomer.whatsapp || '',
      email: apiCustomer.email || '',
      direccion: apiCustomer.direccion || '',
      departamento: apiCustomer.departamento || '',
      municipio: apiCustomer.municipio || '',
      fechaNacimiento: fechaNacimiento,
      tipoResponsabilidad: apiCustomer.tipo_responsabilidad || '',
      tipoAdquiriente: apiCustomer.tipo_adquiriente || '',
      regimenTributario: apiCustomer.regimen_tributario || '',
      contactoNombres: apiCustomer.contacto_nombres || '',
      contactoApellidos: apiCustomer.contacto_apellidos || '',
      contactoTelefono: apiCustomer.contacto_telefono || '',
      contactoDireccion: apiCustomer.contacto_direccion || '',
      cupoAutorizado: apiCustomer.cupo_autorizado,
      idVendedor: apiCustomer.id_vendedor,
      facturaPrecioCosto: apiCustomer.factura_precio_costo,
      facturarConVencimientos: apiCustomer.facturar_con_vencimientos,
      facturarSoloContado: apiCustomer.facturar_solo_contado,
      status: apiCustomer.estado ? 'Activo' : 'Inactivo'
    };
  };

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const id_empresa = getUserEmpresa();
      const response = await clienteService.listar({
        page: currentPage,
        perPage: itemsPerPage,
        search: searchTerm || undefined,
        id_empresa,
        estado: 1
      });

      const customersData = response.clientes.map(convertApiCustomerToLocal);
      setCustomers(customersData);
      setTotalItems(response.total);
    } catch (err: any) {
      console.error('Error al cargar clientes:', err);
      setError(err.mensaje || 'Error al cargar los clientes');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm]);

  const handleSaveCustomer = async (customerData: Customer) => {
    if (!customerData) return;

    try {
      const id_empresa = getUserEmpresa();
      const isNew = customerData.id === 0;

      if (!customerData.nombreRazonSocial || !customerData.numeroDocumento) {
        showError('El nombre y el número de documento son obligatorios.');
        return;
      }

      const apiData = {
        id_empresa,
        nombre_razon_social: customerData.nombreRazonSocial,
        tipo_documento: customerData.tipoDocumento,
        numero_documento: customerData.numeroDocumento,
        digito_verificacion: customerData.digitoVerificacion || undefined,
        telefono: customerData.telefono || undefined,
        celular: customerData.celular || undefined,
        whatsapp: customerData.whatsapp || undefined,
        email: customerData.email || undefined,
        direccion: customerData.direccion || undefined,
        departamento: customerData.departamento || undefined,
        municipio: customerData.municipio || undefined,
        fecha_nacimiento: customerData.fechaNacimiento || undefined,
        tipo_responsabilidad: customerData.tipoResponsabilidad || undefined,
        tipo_adquiriente: customerData.tipoAdquiriente || undefined,
        regimen_tributario: customerData.regimenTributario || undefined,
        contacto_nombres: customerData.contactoNombres || undefined,
        contacto_apellidos: customerData.contactoApellidos || undefined,
        contacto_telefono: customerData.contactoTelefono || undefined,
        contacto_direccion: customerData.contactoDireccion || undefined,
        cupo_autorizado: customerData.cupoAutorizado,
        id_vendedor: customerData.idVendedor || undefined,
        factura_precio_costo: customerData.facturaPrecioCosto,
        facturar_con_vencimientos: customerData.facturarConVencimientos,
        facturar_solo_contado: customerData.facturarSoloContado,
        estado: customerData.status === 'Activo'
      };

      if (isNew) {
        await clienteService.crear(apiData);
        success('Cliente creado exitosamente');
      } else {
        await clienteService.actualizar(customerData.id, apiData);
        success('Cliente actualizado exitosamente');
      }

      fetchCustomers();
      setIsModalOpen(false);
      setEditingCustomer(null);
    } catch (err: any) {
      console.error('Error al guardar cliente:', err);
      showError(err.mensaje || 'Error al guardar el cliente');
    }
  };

  const handleOpenModal = (customer: Customer | null) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleOpenDeleteModal = (customer: Customer) => {
    setDeletingCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingCustomer(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;

    try {
      await clienteService.eliminar(deletingCustomer.id);
      success('Cliente eliminado exitosamente');
      fetchCustomers();
      handleCloseDeleteModal();
    } catch (err: any) {
      console.error('Error al eliminar cliente:', err);
      showError(err.mensaje || 'Error al eliminar el cliente');
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers;
  }, [customers]);

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
          <h1 className="text-3xl font-bold text-gray-800">Listado de Clientes</h1>
          <button
            onClick={() => handleOpenModal(null)}
            className="flex items-center bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Cliente
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, documento o código..."
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
                    Cliente
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
                        <span className="ml-3 text-gray-600">Cargando clientes...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-600">
                      No se encontraron clientes
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="bg-white hover:bg-gray-50">
                      <td className="border-t border-gray-200 px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-bold">{customer.nombreRazonSocial}</div>
                        <div className="text-xs text-gray-500">
                          {customer.tipoDocumento}: {customer.numeroDocumento}
                        </div>
                      </td>
                      <td className="border-t border-gray-200 px-4 py-3 text-gray-700 text-sm font-mono">
                        {customer.codigo}
                      </td>
                      <td className="border-t border-gray-200 px-4 py-3 text-gray-700 text-sm">
                        {customer.telefono || customer.celular || '-'}
                      </td>
                      <td className="border-t border-gray-200 px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenModal(customer)}
                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          >
                            <EditIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(customer)}
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

      {/* Modal de Cliente */}
      {isModalOpen && (
        <CustomerModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveCustomer}
          customer={editingCustomer}
        />
      )}

      {/* Modal de eliminación */}
      {isDeleteModalOpen && deletingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 bg-red-600 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white">Eliminar Cliente</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                ¿Está seguro que desea eliminar el cliente{' '}
                <span className="font-bold">{deletingCustomer.nombreRazonSocial}</span>?
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

export default CustomersPage;
