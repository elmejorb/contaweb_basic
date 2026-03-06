export interface User {
  id_usuario: number;
  username?: string;
  name: string;
  email: string;
  tipo_usuario: string;
  tipo_usuario_texto?: string;
  avatarUrl?: string;
  role?: string;
  empresa?: Empresa;
}

export interface Empresa {
  id_empresa: number;
  nombre_empresa: string;
  nit_empresa: string;
  telefono_empresa?: string;
  email_empresa?: string;
  direccion_empresa?: string;
}

export interface LoginResponse {
  error: boolean;
  mensaje: string;
  token: string;
  usuario: {
    id_usuario: number;
    nombre_us: string;
    email_us: string;
    avatar?: string;
    tipo_usuario: string;
    id_empresa?: number;
    nombre_empresa?: string;
  };
}

export interface ApiError {
  error: boolean;
  mensaje: string;
  errores?: Record<string, string[]>;
}
