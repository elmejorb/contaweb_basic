import React, { useState, FC, useEffect } from 'react';
import { PlusIcon, PrintIcon, TrashIcon, DotsVerticalIcon, EditIcon, SaveIcon, XIcon } from '../components/icons/IconComponents';

interface PageProps {
  setActivePage: (page: string) => void;
}

// --- TYPES & DUMMY DATA ---
type ReferenceStatus = 'Activo' | 'Inactivo';

interface Reference {
  id: number;
  name: string;
  abbreviation: string;
  description: string;
  contains: number;
  productCount: number;
  status: ReferenceStatus;
}

const DUMMY_REFERENCES: Reference[] = [
  { id: 1, name: 'Unidad', abbreviation: 'und', description: 'Venta por unidad individual.', contains: 1, productCount: 150, status: 'Activo' },
  { id: 2, name: 'Caja', abbreviation: 'caj', description: 'Caja de cartón corrugado.', contains: 12, productCount: 45, status: 'Activo' },
  { id: 3, name: 'Bulto', abbreviation: 'blt', description: 'Empaque de 50 kilogramos.', contains: 50, productCount: 8, status: 'Activo' },
  { id: 4, name: 'Litro', abbreviation: 'L', description: 'Medida de volumen para líquidos.', contains: 1, productCount: 12, status: 'Inactivo' },
  { id: 5, name: 'Paquete', abbreviation: 'paq', description: 'Agrupación de varias unidades.', contains: 6, productCount: 0, status: 'Activo' },
];


// --- HELPER COMPONENTS ---
const StatusBadge: FC<{ status: ReferenceStatus }> = ({ status }) => {
  const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full capitalize inline-block";
  const statusClasses = {
    'Activo': 'bg-green-100 text-green-700',
    'Inactivo': 'bg-gray-100 text-gray-700',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const ReferenceModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (referenceData: { name: string; abbreviation: string; description: string; contains: number; status: ReferenceStatus }) => void;
  reference: Reference | null;
}> = ({ isOpen, onClose, onSave, reference }) => {
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [description, setDescription] = useState('');
  const [contains, setContains] = useState(1);
  const [status, setStatus] = useState<ReferenceStatus>('Activo');

  useEffect(() => {
    if (isOpen) {
        if (reference) {
          setName(reference.name);
          setAbbreviation(reference.abbreviation);
          setDescription(reference.description);
          setContains(reference.contains);
          setStatus(reference.status);
        } else {
          // Reset for new
          setName('');
          setAbbreviation('');
          setDescription('');
          setContains(1);
          setStatus('Activo');
        }
    }
  }, [reference, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !abbreviation.trim()) {
        alert("El nombre, abreviatura y descripción son obligatorios.");
        return;
    }
    onSave({ name, abbreviation, description, contains, status });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg transform transition-all animate-fade-in-down">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            {reference ? 'Editar Referencia' : 'Nueva Referencia'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XIcon className="h-6 w-6 text-gray-600"/>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ref-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    id="ref-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="ref-abbr" className="block text-sm font-medium text-gray-700 mb-1">Abreviatura</label>
                  <input
                    id="ref-abbr"
                    type="text"
                    value={abbreviation}
                    onChange={e => setAbbreviation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Ej: und, caj, L"
                    required
                  />
                </div>
            </div>
            <div>
              <label htmlFor="ref-description" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                id="ref-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ref-contains" className="block text-sm font-medium text-gray-700 mb-1">Contenido (unidades)</label>
                  <input
                    id="ref-contains"
                    type="number"
                    value={contains}
                    onChange={e => setContains(parseInt(e.target.value, 10) || 1)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="ref-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    id="ref-status"
                    value={status}
                    onChange={e => setStatus(e.target.value as ReferenceStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
             </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex items-center bg-violet-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-violet-700 transition-colors">
              <SaveIcon className="h-5 w-5 mr-2" />
              Guardar
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
  onConfirm: () => void;
  reference: Reference | null;
}> = ({ isOpen, onClose, onConfirm, reference }) => {
  if (!isOpen || !reference) return null;

  const canDelete = reference.productCount === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all animate-fade-in-down">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            {canDelete ? 'Confirmar Eliminación' : 'No se Puede Eliminar'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XIcon className="h-6 w-6 text-gray-600"/>
          </button>
        </div>
        <div className="p-6">
          {canDelete ? (
            <p className="text-gray-600">
              ¿Estás seguro de que deseas eliminar la referencia <span className="font-bold">"{reference.name}"</span>? Esta acción no se puede deshacer.
            </p>
          ) : (
            <p className="text-gray-600">
              No puedes eliminar la referencia <span className="font-bold">"{reference.name}"</span> porque tiene <span className="font-bold">{reference.productCount}</span> productos asociados.
              <br/><br/>
              Por favor, mueva o elimine los productos antes de intentar eliminar esta referencia.
            </p>
          )}
        </div>
        <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end space-x-2">
          {canDelete ? (
            <>
              <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                Cancelar
              </button>
              <button onClick={onConfirm} className="flex items-center bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                <TrashIcon className="h-5 w-5 mr-2" />
                Confirmar Eliminación
              </button>
            </>
          ) : (
             <button type="button" onClick={onClose} className="bg-violet-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-violet-700 transition-colors">
                Aceptar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


// --- MAIN COMPONENT ---
const ReferencesPage: FC<PageProps> = ({ setActivePage }) => {
  const [references, setReferences] = useState(DUMMY_REFERENCES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReference, setEditingReference] = useState<Reference | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingReference, setDeletingReference] = useState<Reference | null>(null);


  const handleOpenModal = (reference: Reference | null = null) => {
    setEditingReference(reference);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReference(null);
  };

  const handleSaveReference = (formData: { name: string; abbreviation: string; description: string; contains: number; status: ReferenceStatus }) => {
    if (editingReference) {
      // Update logic
      setReferences(references.map(r => 
        r.id === editingReference.id ? { ...r, ...formData } : r
      ));
    } else {
      // Create logic
      const newReference: Reference = {
        id: Math.max(...references.map(r => r.id)) + 1,
        productCount: 0,
        ...formData
      };
      setReferences([newReference, ...references]);
    }
    handleCloseModal();
  };
  
  const handleOpenDeleteModal = (reference: Reference) => {
    setDeletingReference(reference);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeletingReference(null);
    setIsDeleteModalOpen(false);
  };
  
  const handleConfirmDelete = () => {
    if (deletingReference && deletingReference.productCount === 0) {
      setReferences(references.filter(r => r.id !== deletingReference.id));
    }
    handleCloseDeleteModal();
  };


  return (
    <>
      <ReferenceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveReference}
        reference={editingReference}
      />
       <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        reference={deletingReference}
      />
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full mr-3"></span>
              <h2 className="text-2xl font-bold text-gray-800" style={{ color: '#333335' }}>Administrar Referencias</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => handleOpenModal()} className="flex items-center bg-violet-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-violet-700 transition duration-150 text-sm">
              <PlusIcon className="h-5 w-5 mr-2" /> Nueva Referencia
            </button>
            <button className="p-2 rounded-lg bg-violet-50 hover:bg-violet-100">
              <DotsVerticalIcon className="h-5 w-5 text-violet-500" />
            </button>
          </div>
        </div>
        
        <div className="mt-6 border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Referencia</th>
                  <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Abrev.</th>
                  <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Contiene</th>
                  <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Productos</th>
                  <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody>
                {references.map(reference => (
                  <tr key={reference.id} className="bg-white hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 whitespace-nowrap">
                      <div className="text-base font-bold" style={{ color: '#333335' }}>{reference.name}</div>
                      <div className="text-sm text-gray-500">{reference.description}</div>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700 font-mono">{reference.abbreviation}</td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">{reference.contains} unds.</td>
                    <td className="border border-gray-200 px-4 py-3 text-gray-700">{reference.productCount}</td>
                    <td className="border border-gray-200 px-4 py-3"><StatusBadge status={reference.status} /></td>
                    <td className="border border-gray-200 px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                         <button onClick={() => handleOpenModal(reference)} className="p-2 rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200 transition-colors">
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleOpenDeleteModal(reference)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReferencesPage;