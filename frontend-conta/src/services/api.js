import axios from 'axios';

// URL base de la API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para peticiones - agregar token JWT
api.interceptors.request.use(
  (config) => {
    // Agregar el token de autenticación si existe
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

// Interceptor para respuestas - manejo de errores global
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Error de respuesta:', error.response.data);
      console.error('Código de estado:', error.response.status);

      // Si es error 401 (no autorizado), redirigir al login
      if (error.response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/';
      }
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('Error de red:', error.request);
    } else {
      // Algo sucedió al configurar la petición
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Ejemplo de funciones de la API
export const apiService = {
  // GET request
  get: (endpoint, params = {}) => {
    return api.get(endpoint, { params });
  },

  // POST request
  post: (endpoint, data) => {
    return api.post(endpoint, data);
  },

  // PUT request
  put: (endpoint, data) => {
    return api.put(endpoint, data);
  },

  // DELETE request
  delete: (endpoint) => {
    return api.delete(endpoint);
  },

  // Ejemplo: Obtener datos
  // getData: () => {
  //   return api.get('/api/data');
  // },

  // Ejemplo: Crear un registro
  // createRecord: (data) => {
  //   return api.post('/api/records', data);
  // },
};

export default api;
