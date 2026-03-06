import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import DashboardPage from '../../pages/DashboardPage';
import InvoicePage from '../../pages/InvoicePage';
import CategoriesPage from '../../pages/CategoriesPage';
import TaxesPage from '../../pages/TaxesPage';
import UnitMeasuresPage from '../../pages/UnitMeasuresPage';
import ProfilePage from '../../pages/ProfilePage';
import InvoicesListPage from '../../pages/InvoicesListPage';
import ProductsPage from '../../pages/ProductsPage';
import CustomersPage from '../../pages/CustomersPage';
import SuppliersPage from '../../pages/SuppliersPage';
import OrdersPage from '../../pages/OrdersPage';
import OrdersListPage from '../../pages/OrdersListPage';
import MisEmpresas from '../../pages/MisEmpresas';
import DatosEmpresa from '../../pages/DatosEmpresa';
import RegistroUsuarios from '../../pages/RegistroUsuarios';
import CierresCajaPage from '../../pages/CierresCajaPage';
import AbrirCajaPage from '../../pages/AbrirCajaPage';
import CerrarCajaPage from '../../pages/CerrarCajaPage';
import MovimientoCajaPage from '../../pages/MovimientoCajaPage';
import RegistroEmpresaConCRM from '../../pages/RegistroEmpresaConCRM';
import CarteraClientesPage from '../../pages/CarteraClientesPage';
import PagosListPage from '../../pages/PagosListPage';

interface PageProps {
  setActivePage: (page: string) => void;
}

// Simple mapping from page name to component
const pageComponents: { [key: string]: React.FC<PageProps> } = {
  'Dashboard': DashboardPage,
  'Nuevo Pedido': OrdersPage,
  'Listado de Pedidos': OrdersListPage,
  'Nueva Venta': InvoicePage,
  'Categorias': CategoriesPage,
  'Impuestos': TaxesPage,
  'Unidades de Medida': UnitMeasuresPage,
  'Listado de Ventas': InvoicesListPage,
  'Listado de Productos': ProductsPage,
  'Listado de Clientes': CustomersPage,
  'Cartera de Clientes': CarteraClientesPage,
  'Listado de Proveedores': SuppliersPage,
  'Mi Perfil': ProfilePage,
  'Mis Empresas': MisEmpresas,
  'Datos de la Empresa': DatosEmpresa,
  'Registro de Usuarios': RegistroUsuarios,
  'Cierres de Caja': CierresCajaPage,
  'Abrir caja': AbrirCajaPage,
  'Cerrar Caja': CerrarCajaPage,
  'Movimiento de Caja': MovimientoCajaPage,
  'Registrar Empresa CRM': RegistroEmpresaConCRM,
  'Listado de Pagos': PagosListPage,
  // Add other pages here as they are created
};

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('Dashboard');
  const [modulosHabilitados, setModulosHabilitados] = useState<string[] | undefined>(undefined);

  const ActivePageComponent = pageComponents[activePage] || DashboardPage;

  // Obtener módulos habilitados de la empresa actual del usuario
  useEffect(() => {
    const obtenerModulosHabilitados = () => {
      try {
        // Obtener empresa actual del localStorage
        const empresaActualStr = localStorage.getItem('empresaActual');
        if (empresaActualStr) {
          const empresaActual = JSON.parse(empresaActualStr);
          if (empresaActual.modulos_habilitados && Array.isArray(empresaActual.modulos_habilitados)) {
            setModulosHabilitados(empresaActual.modulos_habilitados);
          } else {
            // Si no tiene módulos configurados, permitir acceso completo (empresas legacy)
            setModulosHabilitados(undefined);
          }
        }
      } catch (error) {
        console.error('Error al obtener módulos habilitados:', error);
        setModulosHabilitados(undefined);
      }
    };

    obtenerModulosHabilitados();

    // Escuchar cambios en empresaActual
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'empresaActual') {
        obtenerModulosHabilitados();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleSetActivePage = (page: string) => {
    // Only set active page if it's a known page to prevent errors
    if (pageComponents[page]) {
      setActivePage(page);
    } else {
      console.warn(`Attempted to navigate to unknown page: ${page}. Defaulting to Dashboard.`);
      setActivePage('Dashboard');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isOpen={sidebarOpen}
        activePage={activePage}
        setActivePage={handleSetActivePage}
        onClose={() => setSidebarOpen(false)}
        modulosHabilitados={modulosHabilitados}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} setActivePage={handleSetActivePage} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <ActivePageComponent setActivePage={handleSetActivePage} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;