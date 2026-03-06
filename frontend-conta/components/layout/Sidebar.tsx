import React, { useState, useEffect } from 'react';
import {
    HomeIcon,
    ChevronDownIcon,
    ProductsIcon,
    UserGroupIcon,
    TruckIcon,
    ArrowsRightLeftIcon,
    CogIcon
} from '../icons/IconComponents';

const ZynixLogo: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => (
    <div className="flex items-center space-x-3 text-white px-4 h-16">
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2.66663L3.33325 9.33329V22.6666L16 29.3333L28.6666 22.6666V9.33329L16 2.66663Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.33325 9.33329L16 16L28.6666 9.33329" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 29.3333V16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
        {!isCollapsed && <span className="text-2xl font-semibold">ContaRs Pro</span>}
    </div>
);

// --- MENU CONFIGURATION ---
interface MenuItem {
    label: string;
    icon?: React.FC<{ className?: string }>;
    children?: MenuItem[];
    modulo?: string; // Módulo requerido para mostrar este item (opcional)
}

const menuConfig: MenuItem[] = [
    { label: 'Dashboard', icon: HomeIcon },
    {
        label: 'Inventario',
        icon: ProductsIcon,
        children: [
            { label: 'Categorias' },
            { label: 'Listado de Productos' },
        ]
    },
    {
        label: 'Clientes',
        icon: UserGroupIcon,
        children: [
            { label: 'Listado de Clientes' },
            { label: 'Cartera de Clientes' },
        ]
    },
    {
        label: 'Proveedores',
        icon: TruckIcon,
        children: [
            { label: 'Listado de Proveedores' },
        ]
    },
    {
        label: 'Movimientos',
        icon: ArrowsRightLeftIcon,
        children: [
            { label: 'Listado de Ventas' },
            { label: 'Listado de Pagos' },
            { label: 'Cierres de Caja' },
        ]
    },
    {
        label: 'Opciones',
        icon: CogIcon,
        children: [
            { label: 'Datos de la Empresa' },
            { label: 'Mis Empresas' },
        ]
    },
];


// --- RECURSIVE MENU COMPONENT ---
interface MenuNodeProps {
    item: MenuItem;
    level: number;
    isCollapsed: boolean;
    activePage: string;
    setActivePage: (page: string) => void;
    openMenus: Record<string, boolean>;
    toggleMenu: (label: string) => void;
    isParentActive: boolean;
    modulosHabilitados?: string[];
}

const MenuNode: React.FC<MenuNodeProps> = ({
    item,
    level,
    isCollapsed,
    activePage,
    setActivePage,
    openMenus,
    toggleMenu,
    isParentActive,
    modulosHabilitados
}) => {
    // Verificar si el item requiere un módulo y si está habilitado
    if (item.modulo && modulosHabilitados && modulosHabilitados.length > 0) {
        if (!modulosHabilitados.includes(item.modulo)) {
            return null; // No mostrar este item
        }
    }

    // Filtrar children según módulos habilitados
    const visibleChildren = item.children?.filter(child => {
        if (!child.modulo) return true; // Si no requiere módulo, siempre visible
        if (!modulosHabilitados || modulosHabilitados.length === 0) return true; // Sin restricción
        return modulosHabilitados.includes(child.modulo);
    });

    const hasChildren = visibleChildren && visibleChildren.length > 0;
    const isOpen = openMenus[item.label] || false;
    const isDirectlyActive = activePage === item.label;

    // A parent is considered active if any of its descendants is the active page
    const isChildActive = hasChildren ? visibleChildren!.some(child => activePage.startsWith(child.label)) : false;
    const isActive = isDirectlyActive || isChildActive;

    const handleClick = () => {
        if (hasChildren) {
            toggleMenu(item.label);
        } else {
            setActivePage(item.label);
        }
    };

    const paddingLeft = 12 + (level * 20); // base padding + level indentation

    return (
        <>
            <a
                href="#"
                onClick={(e) => { e.preventDefault(); handleClick(); }}
                className={`flex items-center w-full my-0.5 rounded-lg transition-colors duration-200
                    ${isDirectlyActive ? 'bg-violet-700 text-white' : ''}
                    ${!isDirectlyActive && (isActive || isParentActive) ? 'text-white' : 'text-violet-200'}
                    ${!isDirectlyActive ? 'hover:bg-violet-800 hover:text-white' : ''}
                `}
                style={{ paddingLeft: `${isCollapsed ? 12 : paddingLeft}px`, height: '40px' }}
            >
                {item.icon && level === 0 && <item.icon className="h-6 w-6 shrink-0" />}
                {level > 0 && <span className="w-1.5 h-1.5 bg-current rounded-full mr-4 shrink-0" style={{ marginLeft: `${isCollapsed ? 0 : 4}px` }}></span>}

                {!isCollapsed && <span className={`grow font-medium ${level > 0 ? 'text-sm' : ''}`}>{item.label}</span>}
                
                {!isCollapsed && hasChildren && (
                    <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 shrink-0 mr-3 ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </a>
            {!isCollapsed && hasChildren && isOpen && (
                <div className="pl-0">
                    {visibleChildren!.map(child => (
                        <MenuNode
                            key={child.label}
                            item={child}
                            level={level + 1}
                            isCollapsed={isCollapsed}
                            activePage={activePage}
                            setActivePage={setActivePage}
                            openMenus={openMenus}
                            toggleMenu={toggleMenu}
                            isParentActive={isActive}
                            modulosHabilitados={modulosHabilitados}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

// --- HELPER FUNCTIONS ---
const findPathToActive = (items: MenuItem[], activePage: string): string[] | null => {
    for (const item of items) {
        if (item.label === activePage) {
            return [item.label];
        }
        if (item.children) {
            const path = findPathToActive(item.children, activePage);
            if (path) {
                return [item.label, ...path];
            }
        }
    }
    return null;
};

// --- MAIN SIDEBAR COMPONENT ---
interface SidebarProps {
    activePage: string;
    setActivePage: (page: string) => void;
    isOpen: boolean;
    onClose?: () => void;
    modulosHabilitados?: string[]; // Módulos habilitados para la empresa actual
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen, onClose, modulosHabilitados }) => {
    const isCollapsed = !isOpen;
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const path = findPathToActive(menuConfig, activePage);
        const initialOpenMenus: Record<string, boolean> = {};
        if (path) {
            path.forEach(label => initialOpenMenus[label] = true);
        }
        setOpenMenus(initialOpenMenus);
    }, [activePage]);

    const toggleMenu = (label: string) => {
        setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const handleMenuItemClick = (page: string) => {
        setActivePage(page);
        // Cerrar el menú solo en móvil (cuando el ancho es menor a lg breakpoint)
        if (onClose && window.innerWidth < 1024) {
            onClose();
        }
    };

    return (
        <>
            {/* Overlay para móvil con fade in/out */}
            <div
                className={`fixed inset-0 bg-black z-40 lg:hidden transition-opacity duration-300 ease-in-out ${
                    isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            ></div>

            {/* Sidebar con slide in/out */}
            <aside className={`bg-violet-900 text-white flex-col shrink-0 transition-all duration-300 ease-in-out
                flex lg:flex
                fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
                ${isCollapsed ? 'lg:w-20 w-64' : 'w-64'}
                ${isOpen ? 'lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <ZynixLogo isCollapsed={isCollapsed} />
                <nav className="flex-1 px-2 py-4 overflow-y-auto">
                     {!isCollapsed && <h3 className="px-3 pt-2 pb-2 text-xs font-semibold text-violet-400 uppercase tracking-wider">Principal</h3>}
                     {menuConfig.slice(0, 1).map(item => (
                        <MenuNode
                            key={item.label}
                            item={item}
                            level={0}
                            isCollapsed={isCollapsed}
                            activePage={activePage}
                            setActivePage={handleMenuItemClick}
                            openMenus={openMenus}
                            toggleMenu={toggleMenu}
                            isParentActive={false}
                            modulosHabilitados={modulosHabilitados}
                        />
                    ))}

                    {!isCollapsed && <h3 className="px-3 pt-4 pb-2 text-xs font-semibold text-violet-400 uppercase tracking-wider">Módulos</h3>}
                    {menuConfig.slice(1).map(item => (
                        <MenuNode
                            key={item.label}
                            item={item}
                            level={0}
                            isCollapsed={isCollapsed}
                            activePage={activePage}
                            setActivePage={handleMenuItemClick}
                            openMenus={openMenus}
                            toggleMenu={toggleMenu}
                            isParentActive={false}
                            modulosHabilitados={modulosHabilitados}
                        />
                    ))}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;