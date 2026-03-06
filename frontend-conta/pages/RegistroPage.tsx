import React, { useState } from 'react';
import crmService, { ValidacionTokenResponse } from '../services/crmService';
import { LockClosedIcon, EyeIcon, EyeOffIcon, UserIcon } from '../components/icons/IconComponents';
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

interface RegistroPageProps {
  onBackToLogin: () => void;
}

const RegistroPage: React.FC<RegistroPageProps> = ({ onBackToLogin }) => {
  const [paso, setPaso] = useState(1); // 1: Validar Token, 2: Completar Datos
  const [tokenCRM, setTokenCRM] = useState('');
  const [validando, setValidando] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [datosValidacion, setDatosValidacion] = useState<ValidacionTokenResponse | null>(null);

  // Datos del usuario
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const { toasts, removeToast, success, error: showError } = useToast();

  const handleValidarToken = async () => {
    if (!tokenCRM.trim()) {
      showError('Por favor ingresa el token del CRM');
      return;
    }

    console.log('Iniciando validación de token:', tokenCRM);
    setValidando(true);

    try {
      const resultado = await crmService.validarToken(tokenCRM);
      console.log('Resultado de validación:', resultado);

      if (resultado.error) {
        console.log('Token inválido, mostrando error');
        showError(resultado.mensaje || 'Token inválido');
        setValidando(false);
        return;
      }

      // Token válido, prellenar datos del cliente si existen
      if (resultado.cliente) {
        setEmail(resultado.cliente.email || '');
      }

      setDatosValidacion(resultado);
      success('Token válido. Completa tus datos personales para continuar.');
      setPaso(2);
      setValidando(false);
    } catch (err: any) {
      console.error('Error en catch:', err);
      showError(err.mensaje || 'Error al validar el token');
      setValidando(false);
    }
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!nombres.trim() || !apellidos.trim()) {
      showError('Por favor completa todos los campos');
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

    setRegistrando(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          token_crm: tokenCRM,
          nombres,
          apellidos,
          email,
          password,
          password_confirmation: passwordConfirm,
        }),
      });

      const data = await response.json();

      if (data.error || !response.ok) {
        showError(data.mensaje || 'Error al registrar usuario');
        return;
      }

      success('Registro exitoso. Ahora puedes iniciar sesión');

      // Esperar 2 segundos y volver al login
      setTimeout(() => {
        onBackToLogin();
      }, 2000);
    } catch (err: any) {
      showError(err.mensaje || 'Error de conexión');
    } finally {
      setRegistrando(false);
    }
  };

  const handleVolver = () => {
    setPaso(1);
    setDatosValidacion(null);
    setNombres('');
    setApellidos('');
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
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
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  paso >= 1 ? 'bg-violet-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-white">Token CRM</span>
              </div>
              <div className={`w-24 h-1 mx-4 ${paso >= 2 ? 'bg-violet-600' : 'bg-white bg-opacity-30'}`}></div>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  paso >= 2 ? 'bg-violet-600 text-white' : 'bg-white bg-opacity-30 text-gray-600'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-white">Datos Personales</span>
              </div>
            </div>
          </div>

          {/* Paso 1: Validar Token */}
          {paso === 1 && (
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
              <div className="text-center mb-6">
                <div className="inline-block bg-violet-100 p-3 rounded-xl mb-4">
                  <div className="bg-violet-200 p-2 rounded-lg">
                    <LockClosedIcon className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold">Crear Cuenta</h2>
                <p className="text-gray-500 mt-1">Paso 1: Valida tu token del CRM</p>
              </div>

              <form onSubmit={(e) => {
                console.log('Form submitted!');
                e.preventDefault();
                console.log('Prevented default!');
                handleValidarToken();
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">
                    Token del CRM <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tokenCRM}
                    onChange={(e) => setTokenCRM(e.target.value)}
                    placeholder="Ej: a1b2c3d4e5f6..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Necesitas un token válido generado en nuestro CRM para poder registrarte
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={validando || !tokenCRM.trim()}
                    className={`flex-1 px-6 py-3 rounded-lg font-bold transition-colors ${
                      validando || !tokenCRM.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-violet-600 text-white hover:bg-violet-700'
                    }`}
                  >
                    {validando ? 'Validando...' : 'Validar Token'}
                  </button>
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </form>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>¿No tienes un token?</strong> Contacta con nuestro equipo de ventas para obtener tu suscripción.
                </p>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  ¿Ya tienes una cuenta?{' '}
                  <button
                    onClick={onBackToLogin}
                    className="text-violet-600 hover:text-violet-700 font-semibold hover:underline"
                  >
                    Inicia Sesión
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Paso 2: Completar Datos Personales */}
          {paso === 2 && datosValidacion && (
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
              {/* Información del Plan */}
              <div className="mb-6 p-4 bg-violet-50 border border-violet-200 rounded-lg">
                <p className="text-sm font-semibold text-violet-800 mb-1">Tu Suscripción</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-violet-900">{datosValidacion.suscripcion?.plan}</span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    crmService.getColorEstado(datosValidacion.suscripcion?.estado || 'inactivo')
                  }`}>
                    {datosValidacion.suscripcion?.estado.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="inline-block bg-violet-100 p-3 rounded-xl mb-4">
                  <div className="bg-violet-200 p-2 rounded-lg">
                    <UserIcon className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold">Datos Personales</h2>
                <p className="text-gray-500 mt-1">Paso 2: Completa tu información</p>
              </div>

              <form onSubmit={handleRegistro} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-gray-600 block mb-1">
                      Nombres <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Juan"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-600 block mb-1">
                      Apellidos <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="Pérez"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-600 block mb-1">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-600 block mb-1">
                    Contraseña <span className="text-red-500">*</span>
                  </label>
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
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-violet-600"
                    >
                      {showPassword ? <EyeOffIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-600 block mb-1">
                    Confirmar Contraseña <span className="text-red-500">*</span>
                  </label>
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
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-violet-600"
                    >
                      {showPasswordConfirm ? <EyeOffIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleVolver}
                    disabled={registrando}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-bold disabled:opacity-50"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={registrando}
                    className={`flex-1 px-6 py-3 rounded-lg font-bold transition-colors ${
                      registrando
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {registrando ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creando cuenta...
                      </span>
                    ) : 'Crear Cuenta'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RegistroPage;
