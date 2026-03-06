import React, { useState, useEffect, useRef } from 'react';
import { empresaService, Empresa } from '../src/services/empresaService';
import { HomeIcon, ChevronDownIcon } from './icons/IconComponents';

interface CompanySelectorProps {
  onCompanyChange?: (empresa: Empresa) => void;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ onCompanyChange }) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaActiva, setEmpresaActiva] = useState<Empresa | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar empresas del usuario
  useEffect(() => {
    loadEmpresas();
  }, []);

  // Escuchar evento de recarga de empresas
  useEffect(() => {
    const handleReloadEmpresas = () => {
      loadEmpresas();
    };

    window.addEventListener('reload-empresas', handleReloadEmpresas);
    return () => window.removeEventListener('reload-empresas', handleReloadEmpresas);
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      const data = await empresaService.misEmpresas();
      setEmpresas(data);

      // Cargar empresa activa del localStorage o usar la primera
      const savedEmpresaId = localStorage.getItem('empresa_activa_id');
      if (savedEmpresaId) {
        const empresa = data.find(e => e.id_empresa === parseInt(savedEmpresaId));
        if (empresa) {
          setEmpresaActiva(empresa);
        } else if (data.length > 0) {
          setEmpresaActiva(data[0]);
          localStorage.setItem('empresa_activa_id', data[0].id_empresa.toString());
        }
      } else if (data.length > 0) {
        setEmpresaActiva(data[0]);
        localStorage.setItem('empresa_activa_id', data[0].id_empresa.toString());
      }
    } catch (error) {
      console.error('Error al cargar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmpresa = (empresa: Empresa) => {
    setEmpresaActiva(empresa);
    localStorage.setItem('empresa_activa_id', empresa.id_empresa.toString());
    setIsOpen(false);

    if (onCompanyChange) {
      onCompanyChange(empresa);
    }

    // Recargar la página para que todos los componentes usen la nueva empresa
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center px-3 py-2 text-sm text-gray-600">
        <HomeIcon className="h-5 w-5 mr-2 animate-pulse" />
        <span>Cargando...</span>
      </div>
    );
  }

  if (empresas.length === 0) {
    return (
      <div className="flex items-center px-3 py-2 text-sm text-amber-600">
        <HomeIcon className="h-5 w-5 mr-2" />
        <span>Sin empresas</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <HomeIcon className="h-5 w-5 text-indigo-600" />
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500">Empresa Activa</span>
          <span className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
            {empresaActiva?.nombre_empresa || 'Seleccionar'}
          </span>
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-500 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-2 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500 px-2 py-1">
              Mis Empresas ({empresas.length})
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {empresas.map((empresa) => (
              <button
                key={empresa.id_empresa}
                onClick={() => handleSelectEmpresa(empresa)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start justify-between ${
                  empresaActiva?.id_empresa === empresa.id_empresa ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <HomeIcon className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold text-sm text-gray-800">
                      {empresa.nombre_empresa}
                    </span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-gray-500">NIT: {empresa.nit_empresa}</p>
                    {empresa.codigo_empresa && (
                      <p className="text-xs text-gray-400 font-mono">
                        Código: {empresa.codigo_empresa}
                      </p>
                    )}
                  </div>
                </div>

                {empresaActiva?.id_empresa === empresa.id_empresa && (
                  <span className="text-indigo-600 font-bold text-xl flex-shrink-0">✓</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-2 border-t border-gray-200">
            <button
              onClick={() => {
                setIsOpen(false);
                // Aquí podrías navegar a la página de gestión de empresas
                // setActivePage('Mis Empresas');
              }}
              className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2 hover:bg-indigo-50 rounded transition-colors"
            >
              Administrar Empresas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySelector;
