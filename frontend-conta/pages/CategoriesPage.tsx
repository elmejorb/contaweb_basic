import React, { useState, FC, useEffect } from 'react';
import { PlusIcon, PrintIcon, TrashIcon, DotsVerticalIcon, EditIcon, SaveIcon, XIcon, RefreshIcon } from '../components/icons/IconComponents';
import { categoriaService, Categoria } from '../services/categoriaService';

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

const CategoryModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: { nombre_categoria: string; descripcion_categoria: string; estado: boolean }) => Promise<void>;
  category: Categoria | null;
}> = ({ isOpen, onClose, onSave, category }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (category) {
          setName(category.nombre_categoria);
          setDescription(category.descripcion_categoria || '');
          setStatus(category.estado);
        } else {
          // Reset for new category
          setName('');
          setDescription('');
          setStatus(true);
        }
        setIsSaving(false);
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
        alert("El nombre es obligatorio.");
        return;
    }

    setIsSaving(true);
    try {
      await onSave({ nombre_categoria: name, descripcion_categoria: description, estado: status });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-modal-backdrop">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg animate-modal-content">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            {category ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XIcon className="h-6 w-6 text-gray-600"/>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                id="category-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
            <div>
              <label htmlFor="category-description" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                id="category-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
             <div>
              <label htmlFor="category-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                id="category-status"
                value={status ? "1" : "0"}
                onChange={e => setStatus(e.target.value === "1")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
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
  category: Categoria | null;
}> = ({ isOpen, onClose, onConfirm, category }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !category) return null;

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
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XIcon className="h-6 w-6 text-gray-600"/>
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar la categoría <span className="font-bold">"{category.nombre_categoria}"</span>? Esta acción cambiará su estado a inactivo.
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
const CategoriesPage: FC<PageProps> = ({ setActivePage }) => {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Categoria | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await categoriaService.listar({
        search: searchTerm,
        estado: showInactive ? undefined : 1,
        sortBy: 'nombre_categoria',
        sortOrder: 'asc'
      });
      setCategories(response.categorias);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.mensaje || 'Error al cargar categorías' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [searchTerm, showInactive]);

  const handleOpenModal = (category: Categoria | null = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async (formData: { nombre_categoria: string; descripcion_categoria: string; estado: boolean }) => {
    setLoading(true);
    setMessage(null);
    try {
      if (editingCategory) {
        await categoriaService.actualizar(editingCategory.id_categoria, formData);
        setMessage({ type: 'success', text: 'Categoría actualizada exitosamente' });
      } else {
        await categoriaService.crear(formData);
        setMessage({ type: 'success', text: 'Categoría creada exitosamente' });
      }
      handleCloseModal();
      loadCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.mensaje || 'Error al guardar categoría' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteModal = (category: Categoria) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeletingCategory(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    setLoading(true);
    setMessage(null);
    try {
      await categoriaService.eliminar(deletingCategory.id_categoria);
      setMessage({ type: 'success', text: 'Categoría eliminada exitosamente' });
      handleCloseDeleteModal();
      loadCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.mensaje || 'Error al eliminar categoría' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreCategory = async (id: number) => {
    setRestoringId(id);
    setMessage(null);
    try {
      await categoriaService.restaurar(id);
      setMessage({ type: 'success', text: 'Categoría restaurada exitosamente' });
      loadCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.mensaje || 'Error al restaurar categoría' });
    } finally {
      setRestoringId(null);
    }
  };


  return (
    <>
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCategory}
        category={editingCategory}
      />
       <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        category={deletingCategory}
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
              <h2 className="text-2xl font-bold text-gray-800" style={{ color: '#333335' }}>Administrar Categorías</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => handleOpenModal()} className="flex items-center bg-violet-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-violet-700 transition duration-150 text-sm" disabled={loading}>
              <PlusIcon className="h-5 w-5 mr-2" /> Nueva Categoría
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
              placeholder="Buscar categorías..."
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
            <span className="text-sm text-gray-700">Mostrar inactivas</span>
          </label>
        </div>
        
        <div className="mt-6 border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No se encontraron categorías
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Categorías</th>
                    <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Estado</th>
                    <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Fecha Creación</th>
                    <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(category => (
                    <tr key={category.id_categoria} className="bg-white hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="text-base font-bold" style={{ color: '#333335' }}>{category.nombre_categoria}</div>
                        <div className="text-sm text-gray-500">{category.descripcion_categoria || 'Sin descripción'}</div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3"><StatusBadge status={category.estado} /></td>
                      <td className="border border-gray-200 px-4 py-3 text-gray-700">
                        {category.created_at ? new Date(category.created_at).toLocaleDateString('es-ES') : '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          {category.estado ? (
                            <>
                              <button
                                onClick={() => handleOpenModal(category)}
                                className="p-2 rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200 transition-colors"
                                title="Editar"
                              >
                                <EditIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal(category)}
                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                title="Eliminar"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRestoreCategory(category.id_categoria)}
                              className="flex items-center px-3 py-1 text-sm rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Restaurar"
                              disabled={restoringId === category.id_categoria}
                            >
                              {restoringId === category.id_categoria ? (
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

export default CategoriesPage;