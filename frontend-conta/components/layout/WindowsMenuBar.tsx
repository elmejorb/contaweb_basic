
import React, { useState, useRef, useEffect } from 'react';

interface MenuItem {
    name: string;
    subItems?: string[];
}

const menuData: MenuItem[] = [
    { name: 'Inventario', subItems: ['Productos', 'Categorías', 'Ajustes de Stock'] },
    { name: 'Clientes', subItems: ['Nuevo Cliente', 'Lista de Clientes'] },
    { name: 'Proveedor', subItems: ['Nuevo Proveedor', 'Lista de Proveedores'] },
    { name: 'Compras y Ventas', subItems: ['Nueva Factura', 'Historial de Ventas', 'Registrar Compra'] },
    { name: 'Cartera', subItems: ['Cuentas por Cobrar', 'Cuentas por Pagar'] },
    { name: 'Movimientos', subItems: ['Ingresos', 'Egresos'] },
    { name: 'Informes', subItems: ['Ventas por Fecha', 'Resumen de IVA'] },
    { name: 'Opciones', subItems: ['Configuración General', 'Usuarios'] },
    { name: 'Acerca de' },
    { name: 'Salir' },
];

const MenuItemComponent: React.FC<{ item: MenuItem; activeMenu: string | null; setActiveMenu: (name: string | null) => void }> = ({ item, activeMenu, setActiveMenu }) => {
    const menuRef = useRef<HTMLLIElement>(null);
    const isOpen = activeMenu === item.name;

    const handleMouseEnter = () => {
        if (activeMenu !== null) { // Only switch on hover if a menu is already open
             setActiveMenu(item.name);
        }
    };
    
    const handleClick = () => {
        if(isOpen) {
            setActiveMenu(null);
        } else {
            setActiveMenu(item.name);
        }
    };

    return (
        <li className="relative" ref={menuRef} onMouseEnter={handleMouseEnter}>
            <button
                onClick={handleClick}
                className={`px-3 py-1 text-sm rounded ${isOpen ? 'bg-violet-100 text-violet-800' : 'hover:bg-gray-200'}`}
            >
                {item.name}
            </button>
            {isOpen && item.subItems && (
                <ul className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-20 py-1 border border-gray-200">
                    {item.subItems.map((subItem) => (
                        <li key={subItem}>
                            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-violet-500 hover:text-white">
                                {subItem}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
};

const WindowsMenuBar: React.FC = () => {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const menuBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuBarRef.current && !menuBarRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={menuBarRef} className="bg-gray-100 border-b border-gray-300 px-2 shadow-sm">
            <ul className="flex items-center space-x-1">
                {menuData.map((item) => (
                    <MenuItemComponent key={item.name} item={item} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
                ))}
            </ul>
        </div>
    );
};

export default WindowsMenuBar;