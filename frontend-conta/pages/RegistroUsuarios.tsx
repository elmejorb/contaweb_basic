import React, { useState, useEffect } from 'react';
import { usuarioEmpresaService, Usuario, TipoUsuario, CrearUsuarioData, ActualizarUsuarioData } from '../src/services/usuarioEmpresaService';
import { UserIcon, PlusIcon, EditIcon, TrashIcon, XIcon } from '../components/icons/IconComponents';

const RegistroUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tiposUsuario, setTiposUsuario] = useState<TipoUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'editar'>('crear');
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<CrearUsuarioData>({
    nombre_us: '',
    email_us: '',
    password: '',
    id_tipo_usuario: 0
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const empresaActivaId = localStorage.getItem('empresa_activa_id');

      if (!empresaActivaId) {
        setErrors({ general: 'No hay empresa activa seleccionada' });
        setLoading(false);
        return;
      }

      const [usuariosData, tiposData] = await Promise.all([
        usuarioEmpresaService.listar(parseInt(empresaActivaId)),
        usuarioEmpresaService.getTiposUsuario()
      ]);

      setUsuarios(usuariosData);
      setTiposUsuario(tiposData);
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      setErrors({ general: 'Error al cargar los datos' });
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCrear = () => {
    setModalMode('crear');
    setSelectedUsuario(null);
    setFormData({
      nombre_us: '',
      email_us: '',
      password: '',
      id_tipo_usuario: tiposUsuario.length > 0 ? tiposUsuario[0].id_tipo_usuario : 0
    });
    setErrors({});
    setShowModal(true);
  };

  const abrirModalEditar = (usuario: Usuario) => {
    setModalMode('editar');
    setSelectedUsuario(usuario);
    setFormData({
      nombre_us: usuario.nombre_us,
      email_us: usuario.email_us,
      password: '',
      id_tipo_usuario: usuario.id_tipo_usuario
    });
    setErrors({});
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setSelectedUsuario(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    const empresaActivaId = localStorage.getItem('empresa_activa_id');
    if (!empresaActivaId) return;

    try {
      if (modalMode === 'crear') {
        await usuarioEmpresaService.crear(parseInt(empresaActivaId), formData);
        setSuccessMessage('Usuario creado exitosamente');
      } else if (selectedUsuario) {
        const updateData: ActualizarUsuarioData = {
          nombre_us: formData.nombre_us,
          email_us: formData.email_us,
          id_tipo_usuario: formData.id_tipo_usuario
        };

        // Solo incluir password si se proporcionó
        if (formData.password) {
          updateData.password = formData.password;
        }

        await usuarioEmpresaService.actualizar(
          parseInt(empresaActivaId),
          selectedUsuario.id_usuario,
          updateData
        );
        setSuccessMessage('Usuario actualizado exitosamente');
      }

      await cargarDatos();
      cerrarModal();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      if (error.response?.data?.errores) {
        setErrors(error.response.data.errores);
      } else {
        setErrors({ general: error.response?.data?.mensaje || 'Error al guardar el usuario' });
      }
    }
  };

  const handleCambiarEstado = async (usuario: Usuario) => {
    const empresaActivaId = localStorage.getItem('empresa_activa_id');
    if (!empresaActivaId) return;

    const accion = usuario.estado_us === 1 ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro de ${accion} a ${usuario.nombre_us}?`)) {
      return;
    }

    try {
      await usuarioEmpresaService.cambiarEstado(parseInt(empresaActivaId), usuario.id_usuario);
      setSuccessMessage(`Usuario ${accion === 'activar' ? 'activado' : 'desactivado'} exitosamente`);
      await cargarDatos();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrors({ general: error.response?.data?.mensaje || `Error al ${accion} el usuario` });
    }
  };

  const handleEliminar = async (usuario: Usuario) => {
    const empresaActivaId = localStorage.getItem('empresa_activa_id');
    if (!empresaActivaId) return;

    if (!confirm(`¿Estás seguro de eliminar a ${usuario.nombre_us}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await usuarioEmpresaService.eliminar(parseInt(empresaActivaId), usuario.id_usuario);
      setSuccessMessage('Usuario eliminado exitosamente');
      await cargarDatos();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrors({ general: error.response?.data?.mensaje || 'Error al eliminar el usuario' });
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <UserIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Registro de Usuarios</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestiona los usuarios de tu empresa
            </p>
          </div>
        </div>
        <button
          onClick={abrirModalCrear}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nuevo Usuario</span>
        </button>
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

      {/* Lista de Usuarios */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Cargando usuarios...</span>
                  </div>
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No hay usuarios registrados. Crea tu primer usuario.
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.id_usuario} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {usuario.nombre_us}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{usuario.email_us}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {usuario.tipo_usuario?.nombre_tipo || 'Sin rol'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleCambiarEstado(usuario)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        usuario.estado_us === 1
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } transition-colors cursor-pointer`}
                    >
                      {usuario.estado_us === 1 ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => abrirModalEditar(usuario)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <EditIcon className="h-5 w-5 inline" />
                    </button>
                    <button
                      onClick={() => handleEliminar(usuario)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear/Editar Usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === 'crear' ? 'Nuevo Usuario' : 'Editar Usuario'}
              </h3>
              <button
                onClick={cerrarModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_us}
                    onChange={(e) => setFormData({ ...formData, nombre_us: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  {errors.nombre_us && (
                    <p className="text-red-500 text-xs mt-1">{errors.nombre_us[0]}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email_us}
                    onChange={(e) => setFormData({ ...formData, email_us: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  {errors.email_us && (
                    <p className="text-red-500 text-xs mt-1">{errors.email_us[0]}</p>
                  )}
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña {modalMode === 'editar' && '(dejar en blanco para no cambiar)'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required={modalMode === 'crear'}
                    minLength={6}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>
                  )}
                  {modalMode === 'crear' && (
                    <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                  )}
                </div>

                {/* Tipo de Usuario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol *
                  </label>
                  <select
                    value={formData.id_tipo_usuario}
                    onChange={(e) => setFormData({ ...formData, id_tipo_usuario: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value={0}>Selecciona un rol</option>
                    {tiposUsuario.map((tipo) => (
                      <option key={tipo.id_tipo_usuario} value={tipo.id_tipo_usuario}>
                        {tipo.nombre_tipo}
                      </option>
                    ))}
                  </select>
                  {errors.id_tipo_usuario && (
                    <p className="text-red-500 text-xs mt-1">{errors.id_tipo_usuario[0]}</p>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {modalMode === 'crear' ? 'Crear Usuario' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Información */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2 text-sm">Información</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Los usuarios creados tendrán acceso solo a la empresa actual</li>
          <li>Puedes activar/desactivar usuarios sin eliminarlos</li>
          <li>El email debe ser único en el sistema</li>
          <li>Al editar un usuario, deja la contraseña en blanco si no deseas cambiarla</li>
        </ul>
      </div>
    </div>
  );
};

export default RegistroUsuarios;
