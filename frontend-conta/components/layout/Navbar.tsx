import React, { useState, useRef, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { UserIcon, LogoutIcon, MenuIcon, SearchIcon, MoonIcon, ShoppingCartIcon, BellIcon, ViewGridIcon, ArrowsExpandIcon, CogIcon } from '../icons/IconComponents';
import CompanySelector from '../CompanySelector';
import { SERVER_URL } from '../../services/authService';

interface NavbarProps {
    setActivePage?: (page: string) => void;
    toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, setActivePage }) => {
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const IconButton: React.FC<{ children: React.ReactNode, badge?: number }> = ({ children, badge }) => (
        <button className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700">
            {children}
            {badge && (
                <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">
                    {badge}
                </span>
            )}
        </button>
    );

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
            {/* Left Side */}
            <div className="flex items-center space-x-4">
                 <button onClick={toggleSidebar} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 lg:hidden">
                    <MenuIcon className="w-6 h-6" />
                 </button>
                 <div className="hidden md:block">
                     <p className="font-semibold text-xl">Bienvenida, {user?.name?.split(' ')[0]}!</p>
                     <p className="text-sm text-slate-500">Rastrea tu actividad de ventas, clientes potenciales y negocios aquí.</p>
                 </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-2">
                {/* Selector de Empresa */}
                <CompanySelector onCompanyChange={(empresa) => console.log('Empresa cambiada:', empresa)} />

                <div className="w-px h-6 bg-slate-200 mx-2"></div>

                {/* Notificaciones */}
                <div className="relative" ref={notificationsRef}>
                    <button
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell w-5 h-5 text-gray-600">
                            <path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
                            <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>
                        </svg>
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    {notificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-xl z-20 border border-slate-200">
                            <div className="px-4 py-3 border-b border-slate-200">
                                <h3 className="text-sm font-semibold text-slate-700">Notificaciones</h3>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {/* Ejemplo de notificación - Puedes agregar lógica después */}
                                <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-100 cursor-pointer">
                                    <p className="text-sm font-medium text-slate-700">Nueva venta registrada</p>
                                    <p className="text-xs text-slate-500 mt-1">Hace 5 minutos</p>
                                </div>
                                <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-100 cursor-pointer">
                                    <p className="text-sm font-medium text-slate-700">Cliente agregado</p>
                                    <p className="text-xs text-slate-500 mt-1">Hace 1 hora</p>
                                </div>
                                <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-100 cursor-pointer">
                                    <p className="text-sm font-medium text-slate-700">Producto sin stock</p>
                                    <p className="text-xs text-slate-500 mt-1">Hace 2 horas</p>
                                </div>
                                <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-100 cursor-pointer">
                                    <p className="text-sm font-medium text-slate-700">Pago recibido</p>
                                    <p className="text-xs text-slate-500 mt-1">Hace 3 horas</p>
                                </div>
                                <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
                                    <p className="text-sm font-medium text-slate-700">Nueva sincronización CRM</p>
                                    <p className="text-xs text-slate-500 mt-1">Hace 5 horas</p>
                                </div>
                            </div>
                            <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
                                <button className="text-xs text-violet-600 hover:text-violet-700 font-medium w-full text-center">
                                    Ver todas las notificaciones
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-slate-200 mx-2"></div>
                
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center space-x-3 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <img
                            className="h-9 w-9 rounded-full object-cover"
                            src={user?.avatarUrl?.startsWith('/uploads') ? `${SERVER_URL}${user.avatarUrl}` : user?.avatarUrl}
                            alt="User Avatar"
                        />
                        <div className="text-left hidden md:block">
                            <div className="font-semibold text-sm text-slate-700">{user?.name}</div>
                            <div className="text-xs text-slate-500">{user?.role}</div>
                        </div>
                    </button>
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20 py-1 border border-slate-200">
                            <button onClick={() => { setActivePage?.('Mi Perfil'); setDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                                <UserIcon className="h-5 w-5 mr-3" />
                                Mi Perfil
                            </button>
                            <button
                                onClick={logout}
                                className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                                <LogoutIcon className="h-5 w-5 mr-3" />
                                Salir
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;