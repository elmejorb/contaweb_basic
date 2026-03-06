# API de Cartera - Documentación

## Descripción
Sistema para gestionar los saldos de cartera de clientes y proveedores. Permite sincronizar registros individuales o en lote desde sistemas externos.

## Endpoints Disponibles

### 1. Listar Cartera de Clientes
**GET** `/api/cartera/clientes`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "error": false,
  "saldos": [
    {
      "id_saldo_cartera": 1,
      "id_empresa": 5,
      "codigo_tercero": "130843",
      "nombre_tercero": "EVER HERNANDEZ",
      "tipo": "cliente",
      "saldo_total": "1107716.00",
      "created_at": "2026-01-08T16:00:00.000000Z",
      "updated_at": "2026-01-08T16:00:00.000000Z"
    }
  ]
}
```

---

### 2. Listar Cartera de Proveedores
**GET** `/api/cartera/proveedores`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:** (similar a cartera de clientes, pero con `tipo: "proveedor"`)

---

### 3. Sincronizar Cartera de Clientes
**POST** `/api/cartera/clientes/sincronizar`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (Un solo registro):**
```json
{
  "codigo": "130843",
  "nombre": "EVER HERNANDEZ",
  "saldo": 1107716.00
}
```

**Body (Múltiples registros):**
```json
[
  {
    "codigo": "130843",
    "nombre": "EVER HERNANDEZ",
    "saldo": 1107716.00
  },
  {
    "codigo": "130807",
    "nombre": "NILSON GONZALES",
    "saldo": 1004646.00
  },
  {
    "codigo": "130802",
    "nombre": "EMIRO MONTES DIAZ",
    "saldo": 988330.00
  }
]
```

**Respuesta:**
```json
{
  "error": false,
  "mensaje": "Cartera de clientes sincronizada exitosamente",
  "registros_creados": 2,
  "registros_actualizados": 1,
  "total_procesados": 3
}
```

**Notas:**
- Si el registro ya existe (mismo `codigo` y `empresa`), se actualiza el saldo y nombre
- Si no existe, se crea uno nuevo
- Usa `updateOrCreate` para evitar duplicados

---

### 4. Sincronizar Cartera de Proveedores
**POST** `/api/cartera/proveedores/sincronizar`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:** (igual formato que clientes)

---

### 5. Obtener Resumen de Cartera
**GET** `/api/cartera/resumen`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "error": false,
  "resumen": {
    "clientes": {
      "cantidad": 14,
      "total_por_cobrar": "10567859.00"
    },
    "proveedores": {
      "cantidad": 5,
      "total_por_pagar": "2350000.00"
    }
  }
}
```

---

### 6. Eliminar Saldo de Cartera
**DELETE** `/api/cartera/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "error": false,
  "mensaje": "Registro eliminado exitosamente"
}
```

---

## Validaciones

### Para sincronizar (clientes o proveedores):
- `codigo`: Requerido, string, máximo 50 caracteres
- `nombre`: Requerido, string, máximo 255 caracteres
- `saldo`: Requerido, numérico

### Errores comunes:
```json
{
  "error": true,
  "mensaje": "Datos inválidos",
  "errores": {
    "registros.0.codigo": ["El campo codigo es obligatorio"],
    "registros.1.saldo": ["El campo saldo debe ser numérico"]
  }
}
```

---

## Ejemplo de Uso con cURL

### Sincronizar un solo cliente:
```bash
curl -X POST http://localhost:8000/api/cartera/clientes/sincronizar \
  -H "Authorization: Bearer tu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "130843",
    "nombre": "EVER HERNANDEZ",
    "saldo": 1107716.00
  }'
```

### Sincronizar múltiples clientes:
```bash
curl -X POST http://localhost:8000/api/cartera/clientes/sincronizar \
  -H "Authorization: Bearer tu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '[
    {"codigo": "130843", "nombre": "EVER HERNANDEZ", "saldo": 1107716.00},
    {"codigo": "130807", "nombre": "NILSON GONZALES", "saldo": 1004646.00},
    {"codigo": "130802", "nombre": "EMIRO MONTES DIAZ", "saldo": 988330.00}
  ]'
```

---

## Estructura de la Base de Datos

### Tabla: `saldos_cartera`
```sql
- id_saldo_cartera (PK)
- id_empresa (FK -> empresas)
- codigo_tercero (string 50)
- nombre_tercero (string 255)
- tipo (enum: 'cliente', 'proveedor')
- saldo_total (decimal 15,2)
- created_at
- updated_at

Unique Key: (id_empresa, codigo_tercero, tipo)
```

Esta estructura permite:
- Un mismo código puede existir como cliente Y como proveedor
- No permite duplicados para la misma empresa + código + tipo
- Mantiene histórico con timestamps
