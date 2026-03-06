import api from './authService';

export const profileService = {
  /**
   * Actualizar nombre del perfil
   */
  actualizarPerfil: async (nombreCompleto: string) => {
    try {
      const response = await api.put('/perfil', {
        nombre_us: nombreCompleto
      });
      
      // Actualizar localStorage
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        user.nombre_us = nombreCompleto;
        localStorage.setItem('user_data', JSON.stringify(user));
      }
      
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al actualizar perfil' };
    }
  },

  /**
   * Actualizar email (requiere validación posterior)
   */
  actualizarEmail: async (emailNuevo: string) => {
    try {
      const response = await api.put('/perfil/email', {
        email_nuevo: emailNuevo
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al actualizar email' };
    }
  },

  /**
   * Cambiar contraseña
   */
  cambiarPassword: async (passwordActual: string, passwordNuevo: string, passwordNuevoConfirmacion: string) => {
    try {
      const response = await api.put('/perfil/password', {
        password_actual: passwordActual,
        password_nuevo: passwordNuevo,
        password_nuevo_confirmation: passwordNuevoConfirmacion
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al cambiar contraseña' };
    }
  },

  /**
   * Subir foto de perfil
   */
  subirFotoPerfil: async (archivo: File) => {
    try {
      const formData = new FormData();
      formData.append('foto', archivo);

      const response = await api.post('/perfil/foto', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Actualizar localStorage con el nuevo avatar
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        user.avatar = response.data.avatar;
        localStorage.setItem('user_data', JSON.stringify(user));
      }

      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al subir foto de perfil' };
    }
  },

  /**
   * Eliminar foto de perfil
   */
  eliminarFotoPerfil: async () => {
    try {
      const response = await api.delete('/perfil/foto');

      // Actualizar localStorage
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        user.avatar = null;
        localStorage.setItem('user_data', JSON.stringify(user));
      }

      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: true, mensaje: 'Error al eliminar foto de perfil' };
    }
  }
};
