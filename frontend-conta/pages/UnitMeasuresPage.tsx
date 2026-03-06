import React, { useState, FC, useEffect } from 'react';
import { DotsVerticalIcon, SearchIcon } from '../components/icons/IconComponents';
import unidadMedidaService, { UnidadMedida } from '../services/unidadMedidaService';

interface PageProps {
  setActivePage: (page: string) => void;
}

const UnitMeasuresPage: FC<PageProps> = ({ setActivePage }) => {
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [perPage] = useState(25);

  useEffect(() => {
    loadUnidades();
  }, []);

  useEffect(() => {
    loadUnidades();
  }, [searchTerm, currentPage]);

  const loadUnidades = async () => {
    setLoading(true);
    try {
      const response = await unidadMedidaService.listar({
        search: searchTerm,
        sortBy: 'name',
        sortOrder: 'asc',
        per_page: perPage,
        page: currentPage
      });
      setUnidades(response.unidades);
      setTotalPages(response.last_page);
      setTotalRecords(response.total);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.mensaje || 'Error al cargar unidades de medida' });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Info Message */}
      <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-start">
          <SearchIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800 font-semibold">Unidades de Medida DIAN</p>
            <p className="text-xs text-blue-600 mt-1">
              Esta tabla contiene las {totalRecords.toLocaleString()} unidades de medida oficiales requeridas para facturación electrónica en Colombia.
              Los datos son de solo lectura y se cargan mediante importación.
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && message.type !== 'info' && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full mr-3"></span>
          <h2 className="text-2xl font-bold text-gray-800" style={{ color: '#333335' }}>Unidades de Medida</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg bg-violet-50 hover:bg-violet-100">
            <DotsVerticalIcon className="h-5 w-5 text-violet-500" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre o código... (ej: spray pequeño, 04)"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          </div>
        ) : unidades.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No se encontraron unidades de medida
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-24">
                      Código
                    </th>
                    <th className="border border-gray-200 px-4 py-3 bg-gray-100 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Nombre / Descripción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {unidades.map(unidad => (
                    <tr key={unidad.id} className="bg-white hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className="inline-block px-3 py-1 text-sm font-mono font-bold bg-violet-100 text-violet-700 rounded">
                          {unidad.code}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="text-base font-semibold text-gray-800">{unidad.name}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{(currentPage - 1) * perPage + 1}</span> a{' '}
                  <span className="font-medium">{Math.min(currentPage * perPage, totalRecords)}</span> de{' '}
                  <span className="font-medium">{totalRecords.toLocaleString()}</span> registros
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Primera
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Página <span className="font-semibold">{currentPage}</span> de{' '}
                    <span className="font-semibold">{totalPages}</span>
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Última
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UnitMeasuresPage;
