import React, { useState, FC } from 'react';
import useAuth from '../hooks/useAuth';
import { profileService } from '../services/profileService';
import { SERVER_URL } from '../services/authService';
import {
    UserIcon, BellIcon, LockClosedIcon, TrashIcon, CameraIcon,
    HashtagIcon, CalendarIcon, CheckCircleIcon, ShieldExclamationIcon,
    ClockIcon, RefreshIcon, DownloadIcon, SearchIcon, MailIcon, TicketIcon,
    ClipboardCheckIcon, ChevronDownIcon, EyeIcon, EyeOffIcon
} from '../components/icons/IconComponents';

interface PageProps {
  setActivePage: (page: string) => void;
}

type ProfileTab = 'info' | 'activity' | 'notifications';

const InformationTab: FC<{
    user: any;
    onSave: (nombre: string) => Promise<void>;
    loading: boolean;
    message: { type: string; text: string } | null;
    onPhotoUpload: (file: File) => Promise<void>;
    onPhotoDelete: () => Promise<void>;
    onPasswordChange: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
}> = ({ user, onSave, loading, message, onPhotoUpload, onPhotoDelete, onPasswordChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [nombre, setNombre] = useState(user?.name || "");
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Password change states
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Password validation in real-time
    const passwordRequirements = {
        minLength: passwordData.newPassword.length >= 6,
        hasLetters: /[a-zA-Z]/.test(passwordData.newPassword),
        hasNumbers: /[0-9]/.test(passwordData.newPassword),
        passwordsMatch: passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword.length > 0
    };

    const handlePasswordChange = async () => {
        await onPasswordChange(passwordData.currentPassword, passwordData.newPassword, passwordData.confirmPassword);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsChangingPassword(false);
    };

    const cancelPasswordChange = () => {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsChangingPassword(false);
    };

    const handleSave = async () => {
        await onSave(nombre);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setNombre(user?.name || "");
        setIsEditing(false);
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tamaño (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen no debe superar 5MB');
                return;
            }
            // Validar tipo
            if (!file.type.match(/^image\/(jpeg|png|jpg|gif)$/)) {
                alert('Solo se permiten imágenes JPG, PNG o GIF');
                return;
            }
            await onPhotoUpload(file);
        }
    };

    const handlePhotoDelete = async () => {
        if (confirm('¿Estás seguro de que deseas eliminar tu foto de perfil?')) {
            await onPhotoDelete();
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {/* Message Display */}
            {message && (
                <div className={`lg:col-span-3 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
                {/* Personal Info Card */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">Información Personal</h3>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-sm bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                            >
                                Editar Perfil
                            </button>
                        ) : (
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-gray-400"
                                >
                                    {loading ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="text-sm bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg transition disabled:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <div className="relative">
                            <img
                                src={user.avatarUrl?.startsWith('/uploads') ? `${SERVER_URL}${user.avatarUrl}` : user.avatarUrl}
                                alt="Foto de Perfil"
                                className="w-24 h-24 rounded-full object-cover ring-4 ring-white"
                            />
                            {user.avatarUrl?.startsWith('/uploads') && (
                                <button
                                    onClick={handlePhotoDelete}
                                    disabled={loading}
                                    className="absolute top-0 right-0 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 transition-colors disabled:opacity-50"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-700">Foto de Perfil</p>
                            <p className="text-sm text-gray-500">Formatos permitidos: JPG, PNG, GIF (máx. 5MB)</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,image/gif"
                                onChange={handlePhotoChange}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                                className="mt-2 flex items-center text-sm bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                <CameraIcon className="w-5 h-5 mr-2" />
                                Cambiar Foto
                            </button>
                        </div>
                    </div>
                    <div className="mt-6 border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-violet-500"
                                />
                            ) : (
                                <p className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-gray-700">{user?.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Email</label>
                            <p className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-gray-700">{user.email}</p>
                        </div>
                    </div>
                </div>

                {/* Security Card */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">Seguridad</h3>
                            <p className="text-sm text-gray-500 mt-1">Actualiza tu contraseña para mantener tu cuenta segura</p>
                        </div>
                        <button
                            onClick={() => setIsChangingPassword(!isChangingPassword)}
                            className="flex items-center text-sm bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg hover:bg-gray-50 transition"
                        >
                            <LockClosedIcon className="w-5 h-5 mr-2" />
                            Cambiar Contraseña
                        </button>
                    </div>

                    {/* Password Change Form - Expandable */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isChangingPassword ? 'max-h-[600px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
                        <div className="space-y-4 pt-4 border-t">
                            {/* Current Password */}
                            <div>
                                <label className="text-sm font-medium text-gray-500">Contraseña Actual</label>
                                <div className="relative mt-1">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full px-3 py-2 pr-10 bg-gray-50 border rounded-md focus:ring-2 focus:ring-violet-500"
                                        placeholder="••••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswords.current ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="text-sm font-medium text-gray-500">Nueva Contraseña</label>
                                <div className="relative mt-1">
                                    <input
                                        type={showPasswords.new ? 'text' : 'password'}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full px-3 py-2 pr-10 bg-gray-50 border rounded-md focus:ring-2 focus:ring-violet-500"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswords.new ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="text-sm font-medium text-gray-500">Confirmar Nueva Contraseña</label>
                                <div className="relative mt-1">
                                    <input
                                        type={showPasswords.confirm ? 'text' : 'password'}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full px-3 py-2 pr-10 bg-gray-50 border rounded-md focus:ring-2 focus:ring-violet-500"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPasswords.confirm ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Password Requirements */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <h3 className="text-sm font-semibold text-blue-800">Requisitos de contraseña:</h3>
                                        <ul className="mt-2 text-sm space-y-1">
                                            <li className={`flex items-center ${passwordRequirements.minLength ? 'text-green-700' : 'text-blue-700'}`}>
                                                {passwordRequirements.minLength ? (
                                                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                                                ) : (
                                                    <span className="w-4 h-4 mr-2 inline-block">•</span>
                                                )}
                                                Mínimo 6 caracteres
                                            </li>
                                            <li className={`flex items-center ${passwordRequirements.hasLetters ? 'text-green-700' : 'text-blue-700'}`}>
                                                {passwordRequirements.hasLetters ? (
                                                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                                                ) : (
                                                    <span className="w-4 h-4 mr-2 inline-block">•</span>
                                                )}
                                                Contiene letras
                                            </li>
                                            <li className={`flex items-center ${passwordRequirements.hasNumbers ? 'text-green-700' : 'text-blue-700'}`}>
                                                {passwordRequirements.hasNumbers ? (
                                                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                                                ) : (
                                                    <span className="w-4 h-4 mr-2 inline-block">•</span>
                                                )}
                                                Contiene números
                                            </li>
                                            {passwordData.confirmPassword.length > 0 && (
                                                <li className={`flex items-center ${passwordRequirements.passwordsMatch ? 'text-green-700' : 'text-red-700'}`}>
                                                    {passwordRequirements.passwordsMatch ? (
                                                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                                                    ) : (
                                                        <span className="w-4 h-4 mr-2 inline-block">✕</span>
                                                    )}
                                                    Las contraseñas coinciden
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end space-x-2 pt-2">
                                <button
                                    onClick={cancelPasswordChange}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                                >
                                    Cancelar cambio de contraseña
                                </button>
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={loading || !passwordData.currentPassword || !passwordRequirements.minLength || !passwordRequirements.hasLetters || !passwordRequirements.hasNumbers || !passwordRequirements.passwordsMatch}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6">
                {/* Account Details Card */}
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Detalles de Cuenta</h3>
                    <div className="flex items-start">
                        <UserIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 shrink-0" />
                        <div>
                            <p className="text-sm text-gray-500">Rol</p>
                            <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">Super Admin</span>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <HashtagIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 shrink-0" />
                        <div>
                            <p className="text-sm text-gray-500">ID de Usuario</p>
                            <p className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{user.userId}</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <CalendarIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 shrink-0" />
                        <div>
                            <p className="text-sm text-gray-500">Miembro desde</p>
                            <p className="text-sm text-gray-700">{user.memberSince}</p>
                        </div>
                    </div>
                </div>

                {/* Account Status Card */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                     <h3 className="text-xl font-semibold text-gray-800 mb-4">Estado de Cuenta</h3>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Estado</span>
                            <span className="flex items-center text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full"><CheckCircleIcon className="w-4 h-4 mr-1"/>Activo</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Email verificado</span>
                            <span className="flex items-center text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full"><CheckCircleIcon className="w-4 h-4 mr-1"/>Verificado</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Autenticación 2FA</span>
                            <span className="flex items-center text-xs font-semibold bg-red-100 text-red-800 px-2 py-1 rounded-full"><ShieldExclamationIcon className="w-4 h-4 mr-1"/>No configurada</span>
                        </div>
                     </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
                    <div className="space-y-2">
                        <button className="w-full text-left flex items-center text-sm text-gray-700 p-2 rounded-lg hover:bg-gray-100">
                           <BellIcon className="w-5 h-5 mr-3 text-gray-500"/> Notificaciones
                        </button>
                         <button className="w-full text-left flex items-center text-sm text-gray-700 p-2 rounded-lg hover:bg-gray-100">
                           <ClockIcon className="w-5 h-5 mr-3 text-gray-500"/> Ver actividad
                        </button>
                         <button className="w-full text-left flex items-center text-sm text-gray-700 p-2 rounded-lg hover:bg-gray-100">
                           <ShieldExclamationIcon className="w-5 h-5 mr-3 text-gray-500"/> Configurar 2FA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActivityTab: FC = () => {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">Historial de Actividad</h3>
                        <p className="text-sm text-gray-500 mt-1">0 registros encontrados</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-4 md:mt-0">
                         <button className="flex items-center text-sm bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg hover:bg-gray-50 transition">
                           <RefreshIcon className="w-5 h-5 mr-2" />
                           Actualizar
                        </button>
                         <button className="flex items-center text-sm bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg hover:bg-gray-50 transition">
                           <DownloadIcon className="w-5 h-5 mr-2" />
                           Exportar
                        </button>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
                    <div className="relative">
                        <input type="text" placeholder="Buscar en historial..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <div className="relative">
                        <select className="w-full appearance-none bg-white px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500">
                            <option>Todos los tipos</option>
                        </select>
                        <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select className="w-full appearance-none bg-white px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500">
                            <option>Todo el tiempo</option>
                        </select>
                         <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="inline-block p-4 bg-gray-100 rounded-full">
                    <ClockIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-800">No hay actividad registrada</h3>
                <p className="mt-2 text-gray-500">Tu actividad aparecerá aquí cuando comiences a usar el dashboard</p>
            </div>
        </div>
    );
};

const ToggleSwitch: FC = () => {
    const [isOn, setIsOn] = useState(true);
    return (
        <button
            onClick={() => setIsOn(!isOn)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 ${
                isOn ? 'bg-violet-600' : 'bg-gray-200'
            }`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                isOn ? 'translate-x-6' : 'translate-x-1'
            }`} />
        </button>
    );
};

const NotificationsTab: FC = () => {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-800">Notificaciones</h3>
                <p className="text-sm text-gray-500 mt-1">Personaliza cómo y cuándo recibes notificaciones</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="font-semibold text-gray-800">Sobre las notificaciones</h4>
                <p className="text-sm text-gray-500 mt-1">Las notificaciones te ayudan a mantenerte al día con la actividad del equipo. Puedes personalizar cada canal de forma independiente según tus preferencias.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm divide-y">
                {/* Email Notifications */}
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-start">
                            <div className="p-3 bg-blue-100 rounded-lg mr-4">
                                <MailIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <div className="flex items-center">
                                    <h4 className="font-semibold text-gray-800">Email</h4>
                                    <span className="ml-2 bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-full">3 eventos</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Recibe notificaciones en tu correo electrónico</p>
                                <div className="mt-3 space-x-2">
                                    <button className="text-sm font-semibold text-violet-600 hover:underline">Activar todos</button>
                                    <button className="text-sm font-semibold text-gray-500 hover:underline">Desactivar todos</button>
                                </div>
                            </div>
                        </div>
                        <ToggleSwitch />
                    </div>
                </div>
                 {/* Partidos Notifications */}
                <div className="p-6">
                     <div className="flex justify-between items-start">
                        <div className="flex items-start">
                            <div className="p-3 bg-orange-100 rounded-lg mr-4">
                                <TicketIcon className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">Partidos</h4>
                                <p className="text-sm text-gray-500 mt-1">Recordatorios de partidos próximos y resultados</p>
                                <div className="mt-2 flex items-center space-x-2">
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Partido en 1 hora</span>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Resultado del partido</span>
                                </div>
                            </div>
                        </div>
                        <ToggleSwitch />
                    </div>
                </div>
                 {/* Votaciones Notifications */}
                <div className="p-6">
                     <div className="flex justify-between items-start">
                        <div className="flex items-start">
                            <div className="p-3 bg-green-100 rounded-lg mr-4">
                                <ClipboardCheckIcon className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">Votaciones</h4>
                                <p className="text-sm text-gray-500 mt-1">Votaciones activas y resultados</p>
                                <div className="mt-2 flex items-center space-x-2">
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Votación iniciada</span>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Resultados de votación</span>
                                </div>
                            </div>
                        </div>
                        <ToggleSwitch />
                    </div>
                </div>

            </div>
        </div>
    );
};

const ProfilePage: FC<PageProps> = () => {
    const [activeTab, setActiveTab] = useState<ProfileTab>('info');
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

    const handleSaveProfile = async (nombre: string) => {
        setLoading(true);
        setMessage(null);
        try {
            await profileService.actualizarPerfil(nombre);
            setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });

            // Update user in context
            updateUser({ name: nombre });
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.mensaje || 'Error al actualizar el perfil'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (file: File) => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await profileService.subirFotoPerfil(file);
            setMessage({ type: 'success', text: 'Foto actualizada exitosamente' });

            // Update user avatar in context
            updateUser({ avatarUrl: response.avatar });
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.mensaje || 'Error al subir la foto'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoDelete = async () => {
        setLoading(true);
        setMessage(null);
        try {
            await profileService.eliminarFotoPerfil();
            setMessage({ type: 'success', text: 'Foto eliminada exitosamente' });

            // Update user avatar in context (remove it)
            updateUser({ avatarUrl: `https://i.pravatar.cc/150?u=${user?.email}` });
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.mensaje || 'Error al eliminar la foto'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
        setLoading(true);
        setMessage(null);
        try {
            await profileService.cambiarPassword(currentPassword, newPassword, confirmPassword);
            setMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' });
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.mensaje || 'Error al cambiar la contraseña'
            });
        } finally {
            setLoading(false);
        }
    };

    const fullUser = {
        ...user,
        email: 'admin@cangrejeras.com',
        userId: '#HKuvahGBO2ZwAS15eas9dj9ArB2a2',
        memberSince: '2025-10-09T16:25:56.302Z',
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'info':
                return <InformationTab
                    user={fullUser}
                    onSave={handleSaveProfile}
                    loading={loading}
                    message={message}
                    onPhotoUpload={handlePhotoUpload}
                    onPhotoDelete={handlePhotoDelete}
                    onPasswordChange={handlePasswordChange}
                />;
            case 'activity':
                return <ActivityTab />;
            case 'notifications':
                return <NotificationsTab />;
            default:
                return <InformationTab
                    user={fullUser}
                    onSave={handleSaveProfile}
                    loading={loading}
                    message={message}
                    onPhotoUpload={handlePhotoUpload}
                    onPhotoDelete={handlePhotoDelete}
                    onPasswordChange={handlePasswordChange}
                />;
        }
    };
    
    const TabButton: FC<{ tabName: ProfileTab; label: string; icon: FC<{className?: string}> }> = ({ tabName, label, icon: Icon }) => (
        <button
          onClick={() => setActiveTab(tabName)}
          className={`flex items-center justify-center w-full px-4 py-3 font-semibold text-sm rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${
            activeTab === tabName
              ? 'bg-amber-400 text-amber-900 shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Icon className="w-5 h-5 mr-2" />
          {label}
        </button>
      );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
                <p className="mt-1 text-gray-500">Administra tu información personal y configuración de cuenta</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <TabButton tabName="info" label="Información" icon={UserIcon} />
                    <TabButton tabName="activity" label="Actividad" icon={ClockIcon} />
                    <TabButton tabName="notifications" label="Notificaciones" icon={BellIcon} />
                </div>
            </div>

            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default ProfilePage;
