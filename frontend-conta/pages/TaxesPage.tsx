import React, { useState, FC, useEffect } from 'react';
import { PlusIcon, TrashIcon, DotsVerticalIcon, EditIcon, SaveIcon, XIcon, RefreshIcon } from '../components/icons/IconComponents';
import impuestoService, { Impuesto } from '../services/impuestoService';

interface PageProps {
  setActivePage: (page: string) => void;
}

// --- HELPER COMPONENTS ---
const StatusBadge: FC<{ status: boolean }> = ({ status }) => {
  const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full capitalize inline-block";
  const statusClasses = status
    ? 'bg-green-100 text-green-700'
    : 'bg-gray-100 text-gray-700';
  return <span className={`${baseClasses} ${statusClasses}`}>{status ? 'Activo' : 'Inactivo'}</span>;
};

const TaxModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (taxData: { nombre_impuesto: string; porcentaje: number; estado: boolean }) => Promise<void>;
  tax: Impuesto | null;
}> = ({ isOpen, onClose, onSave, tax }) => {
  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState('');
  const [status, setStatus] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (tax) {
          setName(tax.nombre_impuesto);
          setPercentage(tax.porcentaje.toString());
          setStatus(tax.estado);
        } else {
          // Reset for new tax
          setName('');
          setPercentage('');
          setStatus(true);
        }
        setIsSaving(false);
    }
  }, [tax, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
        alert("El nombre del impuesto es obligatorio.");
        return;
    }
    if (!percentage || isNaN(parseFloat(percentage)) || parseFloat(percentage) < 0) {
        alert("El porcentaje debe ser un número válido mayor o igual a 0.");
        return;
    }

    setIsSaving(true);
    try {
      await onSave({
        nombre_impuesto: name,
        porcentaje: parseFloat(percentage),
        estado: status
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-modal-backdrop">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg animate-modal-content">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            {tax ? 'Editar Impuesto' : 'Nuevo Impuesto'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" disabled={isSaving}>
            <XIcon className="h-6 w-6 text-gray-600"/>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="tax-name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Impuesto
              </label>
              <input
                id="tax-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Ej: IVA, INC, IVA Reducido"
                required
                disabled={isSaving}
              />
              <p className="text-xs text-gray-500 mt-1">
                Ejemplos: IVA 19%, IVA 5%, INC 8%, Exento
              </p>
            </div>
            <div>
              <label htmlFor="tax-percentage" className="block text-sm font-medium text-gray-700 mb-1">
                Porcentaje (%)
              </label>
              <input
                id="tax-percentage"
                type="number"
                step="0.01"
                min="0"
                max="999.99"
                value={percentage}
                onChange={e => setPercentage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Ej: 19.00"
                required
                disabled={isSaving}
              />
              <p className="text-xs text-gray-500 mt-1">
                Ingrese el porcentaje del impuesto (0 para exento)
              </p>
            </div>
             <div>
              <label htmlFor="tax-status" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                id="tax-status"
                value={status ? "1" : "0"}
                onChange={e => setStatus(e.target.value === "1")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                disabled={isSaving}
              >
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </select>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center bg-violet-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshIcon className="h-5 w-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <SaveIcon className="h-5 w-5 mr-2" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmationModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  tax: Impuesto | null;
}> = ({ isOpen, onClose, onConfirm, tax }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !tax) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-modal-backdrop">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md animate-modal-content">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            Confirmar Eliminación
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" disabled={isDeleting}>
            <XIcon className="h-6 w-6 text-gray-600"/>
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar el impuesto <span className="font-bold">"{tax.nombre_impuesto} ({tax.porcentaje}%)"</span>? Esta acción cambiará su estado a inactivo.
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <RefreshIcon className="h-5 w-5 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <TrashIcon className="h-5 w-5 mr-2" />
                Confirmar Eliminación
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


// --- MAIN COMPONENT ---
const TaxesPage: FC<PageProps> = ({ setActivePage }) => {
  const [taxes, setTaxes] = useState<Impuesto[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<Impuesto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTax, setDeletingTax] = useState<Impuesto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  useEffect(() => {
    loadTaxes();
  }, []);

  const loadTaxes = async () => {
    setLoading(true);
    try {
      const response = await impuestoService.listar({
        search: searchTerm,
        estado: showInactive ? undefined : 1,
        sortBy: 'nombre_impuesto',
        sortOrder: 'asc'
      });
      setTaxes(response.impuestos);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.mensaje || 'Error al cargar impuestos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxes();
  }, [searchTerm, showInactive]);

  const handleOpenModal = (tax: Impuesto | null = null) => {
    setEditingTax(tax);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTax(null);
  };

  const handleSaveTax = async (formData: { nombre_impuesto: string; porcentaje: number; estado: boolean }) => {
    setLoading(true);
    setMessage(null);
    try {
      if (editingTax) {
        await impuestoService.actualizar(editingTax.id_impuesto, formData);
        setMessage({ type: 'success', text: 'Impuesto actualizado exitosamente' });
      } else {
        await impuestoService.crear(formData);
        setMessage({ type: 'success', text: 'Impuesto creado exitosamente' });
      }
      handleCloseModal();
      loadTaxes();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.mensaje || 'Error al guardar impuesto' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteModal = (tax: Impuesto) => {
    setDeletingTax(tax);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeletingTax(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTax) return;

    setLoading(true);
    setMessage(null);
    try {
      await impuestoService.eliminar(deletingTax.id_impuesto);
      setMessage({ type: 'success', text: 'Impuesto eliminado exitosamente' });
      handleCloseDeleteModal();
      loadTaxes();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.mensaje || 'Error al eliminar impuesto' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreTax = async (id: number) => {
    setRestoringId(id);
    setMessage(null);
    try {
      await impuestoService.restaurar(id);
      setMessage({ type: 'success', text: 'Impuesto restaurado exitosamente' });
      loadTaxes();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.mensaje || 'Error al restaurar impuesto' });
    } finally {
      setRestoringId(null);
    }
  };


  return (
    <>
      <TaxModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTax}
        tax={editingTax}
      />
       <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        tax={deletingTax}
      />
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Success/Error Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full mr-3"></span>
              <h2 className="text-2xl font-bold text-gray-800" style={{ color: '#333335' }}>Administrar Impuestos</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => handleOpenModal()} className="flex items-center bg-violet-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-violet-700 transition duration-150 text-sm" disabled={loading}>
              <PlusIcon className="h-5 w-5 mr-2" /> Nuevo Impuesto
            </button>
            <button className="p-2 rounded-lg bg-violet-50 hover:bg-violet-100">
              <DotsVerticalIcon className="h-5 w-5 text-violet-500" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar impuestos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
            />
            <span className="text-sm text-gray-700">Mostrar inactivos</span>
          </label>
        </div>

        <div className="mt-6 border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
            </div>
          ) : taxes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No se encontraron impuestos
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nombre del Impuesto</th>
                    <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Porcentaje</th>
                    <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Estado</th>
                    <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Fecha Creación</th>
                    <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {taxes.map(tax => (
                    <tr key={tax.id_impuesto} className="bg-white hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="text-base font-bold" style={{ color: '#333335' }}>{tax.nombre_impuesto}</div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className="text-lg font-semibold text-violet-600">{tax.porcentaje}%</span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3"><StatusBadge status={tax.estado} /></td>
                      <td className="border border-gray-200 px-4 py-3 text-gray-700">
                        {tax.created_at ? new Date(tax.created_at).toLocaleDateString('es-ES') : '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          {tax.estado ? (
                            <>
                              <button
                                onClick={() => handleOpenModal(tax)}
                                className="p-2 rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200 transition-colors"
                                title="Editar"
                              >
                                <EditIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal(tax)}
                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                title="Eliminar"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRestoreTax(tax.id_impuesto)}
                              className="flex items-center px-3 py-1 text-sm rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Restaurar"
                              disabled={restoringId === tax.id_impuesto}
                            >
                              {restoringId === tax.id_impuesto ? (
                                <>
                                  <RefreshIcon className="w-4 h-4 mr-1 animate-spin" />
                                  Restaurando...
                                </>
                              ) : (
                                'Restaurar'
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TaxesPage;
