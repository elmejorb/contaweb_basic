import React, { useState } from 'react';
import { authService } from '../services/authService';
import { LockClosedIcon, MailIcon, EyeIcon, EyeOffIcon } from '../components/icons/IconComponents';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

const ZynixLogo: React.FC = () => (
    <div className="flex items-center space-x-3 text-white">
        <div className="w-10 h-10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2.66663L3.33325 9.33329V22.6666L16 29.3333L28.6666 22.6666V9.33329L16 2.66663Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.33325 9.33329L16 16L28.6666 9.33329" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 29.3333V16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
        <span className="text-3xl font-semibold">ContaRs Pro</span>
    </div>
);

interface RecuperarPasswordPageProps {
  onBackToLogin: () => void;
}

const RecuperarPasswordPage: React.FC<RecuperarPasswordPageProps> = ({ onBackToLogin }) => {
  const [paso, setPaso] = useState<1 | 2 | 3>(1); // 1: Email, 2: Código + nueva contraseña, 3: Éxito
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { toasts, removeToast, success, error: showError } = useToast();

  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showError('Ingresa tu correo electrónico');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.solicitarResetPassword(email);
      if (response.error) {
        showError(response.mensaje);
      } else {
        success('Si el correo está registrado, recibirás un código de recuperación.');
        setPaso(2);
      }
    } catch (err: any) {
      showError(err.mensaje || 'Error al solicitar recuperación');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!codigo.trim() || codigo.length !== 6) {
      showError('Ingresa el código de 6 dígitos');
      return;
    }
    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== passwordConfirm) {
      showError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword(email, codigo, password, passwordConfirm);
      if (response.error) {
        showError(response.mensaje);
      } else {
        success(response.mensaje);
        setPaso(3);
      }
    } catch (err: any) {
      showError(err.mensaje || 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleReenviarCodigo = async () => {
    setLoading(true);
    try {
      await authService.solicitarResetPassword(email);
      success('Se ha enviado un nuevo código a tu correo.');
    } catch (err: any) {
      showError(err.mensaje || 'Error al reenviar código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div
        className="min-h-screen bg-cover bg-center text-gray-800"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop')`}}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-500 opacity-90"></div>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h-1v-9h-9v9h-1v-9h-9v9h-1v-9h-9v9h-1v-9h-9v9h-1v-9h-9v9h-1v-9h-9v9H0v-1h5v-9H0v-1h5v-9H0v-1h5v-9H0v-1h5v-9H0v-1h5v-9H0v-1h5V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
          <div className="mb-8">
            <ZynixLogo />
          </div>

          {/* Indicador de pasos */}
          <div className="mb-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  paso >= 1 ? 'bg-violet-600 text-white' : 'bg-white bg-opacity-30 text-gray-600'
                }`}>1</div>
                <span className="ml-2 text-sm font-medium text-white">Correo</span>
              </div>
              <div className={`w-16 h-1 mx-3 ${paso >= 2 ? 'bg-violet-600' : 'bg-white bg-opacity-30'}`}></div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  paso >= 2 ? 'bg-violet-600 text-white' : 'bg-white bg-opacity-30 text-gray-600'
                }`}>2</div>
                <span className="ml-2 text-sm font-medium text-white">Código</span>
              </div>
              <div className={`w-16 h-1 mx-3 ${paso >= 3 ? 'bg-violet-600' : 'bg-white bg-opacity-30'}`}></div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  paso >= 3 ? 'bg-violet-600 text-white' : 'bg-white bg-opacity-30 text-gray-600'
                }`}>3</div>
                <span className="ml-2 text-sm font-medium text-white">Listo</span>
              </div>
            </div>
          </div>

          {/* Paso 1: Ingresar email */}
          {paso === 1 && (
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
              <div className="text-center mb-6">
                <div className="inline-block bg-violet-100 p-3 rounded-xl mb-4">
                  <div className="bg-violet-200 p-2 rounded-lg">
                    <MailIcon className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold">Recuperar Contraseña</h2>
                <p className="text-gray-500 mt-1 text-sm">Ingresa tu correo y te enviaremos un código de verificación</p>
              </div>

              <form onSubmit={handleSolicitarCodigo} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-600 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="correo@ejemplo.com"
                    required
                    autoFocus
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none transition duration-150 ease-in-out disabled:bg-violet-400 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : 'Enviar Código'}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={onBackToLogin}
                  className="text-sm text-violet-600 hover:text-violet-700 font-semibold hover:underline"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Código + nueva contraseña */}
          {paso === 2 && (
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
              <div className="text-center mb-6">
                <div className="inline-block bg-violet-100 p-3 rounded-xl mb-4">
                  <div className="bg-violet-200 p-2 rounded-lg">
                    <LockClosedIcon className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold">Nueva Contraseña</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Ingresa el código enviado a <strong>{email}</strong> y tu nueva contraseña
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-600 block mb-1">Código de Verificación</label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCodigo(val);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-center text-2xl font-bold tracking-[0.5em]"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-600 block mb-1">Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-violet-600">
                      {showPassword ? <EyeOffIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-600 block mb-1">Confirmar Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPasswordConfirm ? 'text' : 'password'}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-violet-600">
                      {showPasswordConfirm ? <EyeOffIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none transition duration-150 ease-in-out disabled:bg-violet-400 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : 'Restablecer Contraseña'}
                  </button>
                </div>
              </form>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setPaso(1)}
                  className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
                >
                  Cambiar correo
                </button>
                <button
                  onClick={handleReenviarCodigo}
                  disabled={loading}
                  className="text-sm text-violet-600 hover:text-violet-700 font-semibold hover:underline disabled:opacity-50"
                >
                  Reenviar código
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Éxito */}
          {paso === 3 && (
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
              <div className="text-center">
                <div className="inline-block bg-green-100 p-3 rounded-xl mb-4">
                  <div className="bg-green-200 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Contraseña Actualizada</h2>
                <p className="text-gray-500 mb-6">Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.</p>
                <button
                  onClick={onBackToLogin}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none transition duration-150 ease-in-out"
                >
                  Ir a Iniciar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RecuperarPasswordPage;
