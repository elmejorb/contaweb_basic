# Conta Web 5

Sistema de Contabilidad con Frontend React y Backend Lumen (Laravel).
Plataforma desde donde los clientes que usan el software Conta Rs pueden visualizar en linea estadisticas

## Estructura del Proyecto

```
conta_web_5/
├── api-conta/              # Backend API - Lumen (PHP)
├── frontend-conta/         # Frontend - React
└── api-conta-web5/temp/   # Archivos temporales
```

## Requisitos

- PHP 8.2.12
- Composer 2.8.12
- Node.js y npm
- MySQL/PostgreSQL (para base de datos)

## Instalación

### Backend (API Lumen)

```bash
cd api-conta
composer install
cp .env.example .env
# Configurar base de datos en .env
php artisan migrate
```

### Frontend (React)

```bash
cd frontend-conta
npm install
```

## Ejecución

### Iniciar Backend (Puerto 8000)

```bash
cd api-conta
php -S localhost:8000 -t public
```

La API estará disponible en: `http://localhost:8000`

### Iniciar Frontend (Puerto 3000)

En otra terminal:

```bash
cd frontend-conta
npm start
```

El frontend estará disponible en: `http://localhost:3000`

## Características Implementadas

### Backend (Lumen)
- CORS configurado para comunicación con React
- Ruta de prueba: `GET /api/test`
- Estructura base para API RESTful

### Frontend (React)
- Servicio API configurado con Axios
- Interceptores para manejo de errores
- Componente de prueba de conexión API
- Variables de entorno configuradas

## Rutas de la API

- `GET /` - Versión de Lumen
- `GET /api/test` - Prueba de conexión API

## Agregar Nuevas Funcionalidades

### Crear una nueva ruta en la API:

1. Edita [api-conta/routes/web.php](api-conta/routes/web.php)
2. Agrega tu ruta dentro del grupo 'api':

```php
$router->get('/api/usuarios', 'UserController@index');
```

### Consumir la ruta desde React:

1. Edita [frontend-conta/src/services/api.js](frontend-conta/src/services/api.js)
2. Agrega una función:

```javascript
export const apiService = {
  // ...
  getUsuarios: () => {
    return api.get('/api/usuarios');
  },
};
```

3. Usa la función en tu componente:

```javascript
import { apiService } from '../services/api';

const response = await apiService.getUsuarios();
console.log(response.data);
```

## Configuración

### Variables de Entorno

**Backend (.env en api-conta/):**
```
APP_NAME=ContaWeb5
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=conta_web5
DB_USERNAME=root
DB_PASSWORD=
```

**Frontend (.env en frontend-conta/):**
```
REACT_APP_API_URL=http://localhost:8000
```

## Próximos Pasos

1. Configurar base de datos
2. Crear migraciones
3. Implementar autenticación (JWT)
4. Crear módulos de contabilidad
5. Desarrollar componentes React

## Soporte

Para cualquier problema o pregunta, consulta la documentación de:
- [Lumen](https://lumen.laravel.com/docs)
- [React](https://react.dev)
