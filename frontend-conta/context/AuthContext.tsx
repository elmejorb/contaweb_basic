import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, LoginResponse, ApiError } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Verificar si hay usuario almacenado al cargar
  useEffect(() => {
    const token = authService.getToken();
    const userData = authService.getUserData();
    
    if (token && userData) {
      // Transformar datos del usuario al formato esperado
      setUser({
        id_usuario: userData.id_usuario,
        username: userData.username || '',
        name: userData.nombre_us || 'Usuario',
        email: userData.email_us,
        tipo_usuario: userData.tipo_usuario,
        tipo_usuario_texto: userData.tipo_usuario,
        avatarUrl: userData.avatar || `https://i.pravatar.cc/150?u=${userData.email_us}`,
        role: userData.tipo_usuario,
        empresa: userData.id_empresa ? {
          id_empresa: userData.id_empresa,
          nombre_empresa: userData.nombre_empresa || '',
          nit_empresa: ''
        } : undefined,
      });
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: LoginResponse = await authService.login(email, password);
      
      if (response.error) {
        setError(response.mensaje);
        throw new Error(response.mensaje);
      }

      // Transformar datos del usuario al formato esperado
      const userData: User = {
        id_usuario: response.usuario.id_usuario,
        username: '',
        name: response.usuario.nombre_us || 'Usuario',
        email: response.usuario.email_us,
        tipo_usuario: response.usuario.tipo_usuario,
        tipo_usuario_texto: response.usuario.tipo_usuario,
        avatarUrl: response.usuario.avatar || `https://i.pravatar.cc/150?u=${response.usuario.email_us}`,
        role: response.usuario.tipo_usuario,
        empresa: response.usuario.id_empresa ? {
          id_empresa: response.usuario.id_empresa,
          nombre_empresa: response.usuario.nombre_empresa || '',
          nit_empresa: ''
        } : undefined,
      };

      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (err: any) {
      const apiError = err as ApiError;
      
      if (apiError.mensaje) {
        setError(apiError.mensaje);
      } else if (apiError.errores) {
        // Si hay errores de validación, mostrar el primero
        const firstError = Object.values(apiError.errores)[0][0];
        setError(firstError);
      } else {
        setError('Error al iniciar sesión. Intente nuevamente.');
      }
      
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);

      // Actualizar también en localStorage
      const userData = authService.getUserData();
      if (userData) {
        const updatedUserData = { ...userData };
        if (updates.name) updatedUserData.nombre_us = updates.name;
        if (updates.avatarUrl) updatedUserData.avatar = updates.avatarUrl;
        localStorage.setItem('user_data', JSON.stringify(updatedUserData));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading, error, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
