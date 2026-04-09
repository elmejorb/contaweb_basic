import axios from 'axios';
import { LoginResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// URL base del servidor (sin /api) para cargar archivos estáticos como imágenes
export const SERVER_URL = API_URL.replace(/\/api$/, '');

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  /**
   * Realizar login
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/login', {
        email,
        password,
      });
      
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.usuario));
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw {
        error: true,
        mensaje: 'Error de conexión. Verifique su conexión a internet.',
      };
    }
  },

  /**
   * Cerrar sesión
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  },

  /**
   * Obtener datos del usuario actual
   */
  me: async () => {
    try {
      const response = await api.get('/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Refrescar token
   */
  refreshToken: async () => {
    try {
      const response = await api.post('/refresh');
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Solicitar código de recuperación de contraseña
   */
  solicitarResetPassword: async (email: string): Promise<{ error: boolean; mensaje: string }> => {
    try {
      const response = await api.post('/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: true, mensaje: 'Error de conexión. Verifique su conexión a internet.' };
    }
  },

  /**
   * Restablecer contraseña con código
   */
  resetPassword: async (
    email: string,
    codigo: string,
    password: string,
    password_confirmation: string
  ): Promise<{ error: boolean; mensaje: string }> => {
    try {
      const response = await api.post('/reset-password', {
        email,
        codigo,
        password,
        password_confirmation,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: true, mensaje: 'Error de conexión. Verifique su conexión a internet.' };
    }
  },

  /**
   * Obtener token almacenado
   */
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  /**
   * Obtener datos del usuario almacenados
   */
  getUserData: () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};

export default api;
