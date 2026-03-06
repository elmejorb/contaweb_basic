import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

function ApiTest() {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testApi = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.get('/api/test');
      setApiData(response.data);
    } catch (err) {
      setError(err.message || 'Error al conectar con la API');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Puedes descomentar esto para probar la API al cargar el componente
    // testApi();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Prueba de Conexión API</h2>

      <button
        onClick={testApi}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Cargando...' : 'Probar Conexión con API'}
      </button>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {apiData && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '5px'
        }}>
          <h3>Respuesta de la API:</h3>
          <pre style={{
            backgroundColor: '#fff',
            padding: '10px',
            borderRadius: '3px',
            overflow: 'auto'
          }}>
            {JSON.stringify(apiData, null, 2)}
          </pre>
        </div>
      )}

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#e9ecef',
        borderRadius: '5px'
      }}>
        <h4>Instrucciones:</h4>
        <ol>
          <li>Asegúrate de que el servidor de Lumen esté corriendo en el puerto 8000</li>
          <li>Ejecuta: <code>php -S localhost:8000 -t public</code> en la carpeta api-conta</li>
          <li>Haz clic en el botón "Probar Conexión con API"</li>
        </ol>
      </div>
    </div>
  );
}

export default ApiTest;
