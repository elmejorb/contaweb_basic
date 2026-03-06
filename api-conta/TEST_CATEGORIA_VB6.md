# Prueba del Endpoint de Categorías VB6

## Endpoint
**POST** `http://localhost:8000/api/categorias/vb6`

## Headers Requeridos
```
Content-Type: application/json
Authorization: Bearer {tu_token_jwt}
```

## Prueba 1: Crear una nueva categoría

### Request Body:
```json
{
  "id_empresa": 1,
  "codigo": "VB001",
  "nombre_categoria": "Electrónica desde VB6"
}
```

### Respuesta esperada (201 Created):
```json
{
  "error": false,
  "mensaje": "Categoría creada desde VB6",
  "accion": "creada",
  "categoria": {
    "id_categoria": 1,
    "id_empresa": 1,
    "codvb6": "VB001",
    "nombre_categoria": "Electrónica desde VB6",
    "descripcion_categoria": null,
    "estado": 1,
    "created_at": "2025-11-21T10:30:00.000000Z",
    "updated_at": "2025-11-21T10:30:00.000000Z"
  }
}
```

## Prueba 2: Actualizar la misma categoría (mismo código)

### Request Body:
```json
{
  "id_empresa": 1,
  "codigo": "VB001",
  "nombre_categoria": "Electrónica y Tecnología",
  "descripcion_categoria": "Categoría actualizada desde VB6"
}
```

### Respuesta esperada (200 OK):
```json
{
  "error": false,
  "mensaje": "Categoría actualizada desde VB6",
  "accion": "actualizada",
  "categoria": {
    "id_categoria": 1,
    "id_empresa": 1,
    "codvb6": "VB001",
    "nombre_categoria": "Electrónica y Tecnología",
    "descripcion_categoria": "Categoría actualizada desde VB6",
    "estado": 1,
    "created_at": "2025-11-21T10:30:00.000000Z",
    "updated_at": "2025-11-21T10:35:00.000000Z"
  }
}
```

## Prueba 3: Crear otra categoría (código diferente)

### Request Body:
```json
{
  "id_empresa": 1,
  "codigo": "VB002",
  "nombre_categoria": "Ropa y Accesorios"
}
```

### Respuesta esperada (201 Created):
```json
{
  "error": false,
  "mensaje": "Categoría creada desde VB6",
  "accion": "creada",
  "categoria": {
    "id_categoria": 2,
    "id_empresa": 1,
    "codvb6": "VB002",
    "nombre_categoria": "Ropa y Accesorios",
    "descripcion_categoria": null,
    "estado": 1,
    "created_at": "2025-11-21T10:40:00.000000Z",
    "updated_at": "2025-11-21T10:40:00.000000Z"
  }
}
```

## Prueba 4: Error - Falta campo requerido

### Request Body:
```json
{
  "id_empresa": 1,
  "codigo": "VB003"
}
```

### Respuesta esperada (422 Unprocessable Entity):
```json
{
  "error": true,
  "mensaje": "Datos inválidos",
  "errores": {
    "nombre_categoria": [
      "El campo nombre categoria es obligatorio."
    ]
  }
}
```

## Prueba 5: Error - Sin autenticación

### Request (sin header Authorization):
```json
{
  "id_empresa": 1,
  "codigo": "VB004",
  "nombre_categoria": "Test"
}
```

### Respuesta esperada (401 Unauthorized):
```json
{
  "error": true,
  "mensaje": "Token no proporcionado"
}
```

## Verificar en Base de Datos

Después de las pruebas, verifica en MySQL/MariaDB:

```sql
SELECT
  id_categoria,
  id_empresa,
  codvb6,
  nombre_categoria,
  descripcion_categoria,
  estado,
  created_at,
  updated_at
FROM categorias
WHERE id_empresa = 1
ORDER BY id_categoria;
```

Deberías ver:
- 2 categorías creadas (VB001 y VB002)
- VB001 con el nombre actualizado "Electrónica y Tecnología"
- VB002 con el nombre "Ropa y Accesorios"

## Curl Commands (Alternativa a Postman)

### 1. Login:
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"password123"}'
```

### 2. Crear categoría (reemplaza TOKEN con el token del login):
```bash
curl -X POST http://localhost:8000/api/categorias/vb6 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"id_empresa":1,"codigo":"VB001","nombre_categoria":"Electrónica desde VB6"}'
```

### 3. Actualizar categoría:
```bash
curl -X POST http://localhost:8000/api/categorias/vb6 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"id_empresa":1,"codigo":"VB001","nombre_categoria":"Electrónica y Tecnología","descripcion_categoria":"Actualizada"}'
```

## Resumen de Códigos HTTP

- **200 OK**: Categoría actualizada exitosamente
- **201 Created**: Categoría creada exitosamente
- **401 Unauthorized**: Token JWT inválido o faltante
- **422 Unprocessable Entity**: Datos inválidos (falta campo requerido)
- **500 Internal Server Error**: Error del servidor

## Campo `accion` en la Respuesta

La respuesta incluye un campo `accion` que te indica qué operación se realizó:
- `"accion": "creada"` → Se creó una nueva categoría
- `"accion": "actualizada"` → Se actualizó una categoría existente

Esto es útil para que tu aplicación VB6 sepa exactamente qué pasó.
