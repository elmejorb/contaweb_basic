# Sincronización con Visual Basic 6

Este documento explica cómo sincronizar datos desde tu aplicación de Visual Basic 6 a la API de Laravel/Lumen.

## Campos Agregados

Se agregó el campo `codvb6` (código de Visual Basic 6) a los siguientes modelos:
- **Categorías**: `id_empresa`, `codvb6`
- **Productos**: `codvb6`
- **Clientes**: `codvb6`
- **Proveedores**: `codvb6`

## Funcionamiento

El campo `codvb6` sirve como identificador único por empresa. Cuando envías un registro desde VB6:
- Si el `codvb6` ya existe para esa empresa, el registro se **actualiza**
- Si el `codvb6` no existe, el registro se **crea**

Esto evita duplicados y permite sincronización bidireccional.

## Endpoints Disponibles

### 1. Sincronizar Categoría Individual
**POST** `/api/sync-vb6/categoria`

```json
{
  "id_empresa": 1,
  "codvb6": "CAT001",
  "nombre_categoria": "Electrónica",
  "descripcion_categoria": "Productos electrónicos",
  "estado": true
}
```

### 2. Sincronizar Producto Individual
**POST** `/api/sync-vb6/producto`

```json
{
  "id_empresa": 1,
  "codvb6": "PROD001",
  "codigo_producto": "P-001",
  "nombre_producto": "Laptop HP",
  "descripcion_producto": "Laptop HP 15.6 pulgadas",
  "precio_compra": 500.00,
  "precio_venta": 750.00,
  "precio_venta_2": 700.00,
  "precio_venta_3": 680.00,
  "precio_venta_4": 650.00,
  "stock_actual": 10,
  "stock_minimo": 2,
  "id_categoria": 1,
  "id_impuesto": 1,
  "unidad_medida": "NIU",
  "estado": true
}
```

### 3. Sincronizar Cliente Individual
**POST** `/api/sync-vb6/cliente`

```json
{
  "id_empresa": 1,
  "codvb6": "CLI001",
  "codigo_cliente": "C-001",
  "nombre_razon_social": "Juan Pérez",
  "tipo_documento": "13",
  "numero_documento": "1234567890",
  "telefono": "3001234567",
  "email": "juan@email.com",
  "direccion": "Calle 123",
  "estado": true
}
```

### 4. Sincronizar Proveedor Individual
**POST** `/api/sync-vb6/proveedor`

```json
{
  "id_empresa": 1,
  "codvb6": "PROV001",
  "codigo_proveedor": "P-001",
  "razon_social": "Proveedores S.A.",
  "nit": "900123456-1",
  "telefono": "6011234567",
  "email": "contacto@proveedor.com",
  "direccion": "Carrera 50",
  "estado": true
}
```

### 5. Sincronización Masiva (Lote)
**POST** `/api/sync-vb6/lote`

Este endpoint permite enviar múltiples registros de cada tipo en una sola petición:

```json
{
  "id_empresa": 1,
  "categorias": [
    {
      "codvb6": "CAT001",
      "nombre_categoria": "Electrónica",
      "estado": true
    },
    {
      "codvb6": "CAT002",
      "nombre_categoria": "Ropa",
      "estado": true
    }
  ],
  "productos": [
    {
      "codvb6": "PROD001",
      "codigo_producto": "P-001",
      "nombre_producto": "Laptop HP",
      "precio_venta": 750.00,
      "stock_actual": 10,
      "estado": true
    }
  ],
  "clientes": [
    {
      "codvb6": "CLI001",
      "nombre_razon_social": "Juan Pérez",
      "numero_documento": "1234567890",
      "estado": true
    }
  ],
  "proveedores": [
    {
      "codvb6": "PROV001",
      "razon_social": "Proveedores S.A.",
      "nit": "900123456-1",
      "estado": true
    }
  ]
}
```

**Respuesta del Lote:**
```json
{
  "error": false,
  "mensaje": "Sincronización masiva completada",
  "resultados": {
    "categorias": {
      "creadas": 2,
      "actualizadas": 0,
      "errores": 0
    },
    "productos": {
      "creadas": 1,
      "actualizadas": 0,
      "errores": 0
    },
    "clientes": {
      "creados": 1,
      "actualizados": 0,
      "errores": 0
    },
    "proveedores": {
      "creados": 1,
      "actualizados": 0,
      "errores": 0
    }
  }
}
```

## Ejemplo de Código en VB6

```vb
' Módulo de sincronización VB6
Private Const API_URL = "http://localhost:8000/api"
Private Const TOKEN = "tu_token_jwt_aqui"

' Función para sincronizar una categoría
Public Function SincronizarCategoria(idEmpresa As Long, codVB6 As String, nombre As String) As Boolean
    Dim http As Object
    Dim url As String
    Dim jsonData As String
    Dim response As String

    Set http = CreateObject("MSXML2.XMLHTTP")
    url = API_URL & "/sync-vb6/categoria"

    ' Construir JSON
    jsonData = "{" & _
        """id_empresa"":" & idEmpresa & "," & _
        """codvb6"":""" & codVB6 & """," & _
        """nombre_categoria"":""" & nombre & """," & _
        """estado"":true" & _
        "}"

    ' Hacer petición
    http.Open "POST", url, False
    http.setRequestHeader "Content-Type", "application/json"
    http.setRequestHeader "Authorization", "Bearer " & TOKEN
    http.send jsonData

    ' Verificar respuesta
    If http.Status = 200 Then
        SincronizarCategoria = True
        MsgBox "Categoría sincronizada exitosamente"
    Else
        SincronizarCategoria = False
        MsgBox "Error al sincronizar: " & http.responseText
    End If

    Set http = Nothing
End Function

' Función para sincronización masiva
Public Function SincronizarLote(idEmpresa As Long) As Boolean
    Dim http As Object
    Dim url As String
    Dim jsonData As String
    Dim rs As ADODB.Recordset
    Dim categorias As String

    Set http = CreateObject("MSXML2.XMLHTTP")
    Set rs = New ADODB.Recordset

    url = API_URL & "/sync-vb6/lote"

    ' Obtener categorías de la base de datos VB6
    rs.Open "SELECT cod_categoria, nombre FROM categorias WHERE sincronizado = 0", cn, adOpenStatic

    categorias = ""
    Do While Not rs.EOF
        If categorias <> "" Then categorias = categorias & ","

        categorias = categorias & "{" & _
            """codvb6"":""" & rs("cod_categoria") & """," & _
            """nombre_categoria"":""" & rs("nombre") & """," & _
            """estado"":true" & _
            "}"

        rs.MoveNext
    Loop

    ' Construir JSON del lote
    jsonData = "{" & _
        """id_empresa"":" & idEmpresa & "," & _
        """categorias"":[" & categorias & "]" & _
        "}"

    ' Enviar petición
    http.Open "POST", url, False
    http.setRequestHeader "Content-Type", "application/json"
    http.setRequestHeader "Authorization", "Bearer " & TOKEN
    http.send jsonData

    If http.Status = 200 Then
        ' Marcar como sincronizado en VB6
        cn.Execute "UPDATE categorias SET sincronizado = 1 WHERE sincronizado = 0"
        SincronizarLote = True
        MsgBox "Sincronización completada"
    Else
        SincronizarLote = False
        MsgBox "Error: " & http.responseText
    End If

    rs.Close
    Set rs = Nothing
    Set http = Nothing
End Function
```

## Autenticación

Todos los endpoints requieren autenticación JWT. Debes:

1. Hacer login primero:
```vb
POST /api/login
{
  "email": "usuario@empresa.com",
  "password": "tu_password"
}
```

2. Guardar el token de la respuesta
3. Incluir el token en cada petición:
```vb
http.setRequestHeader "Authorization", "Bearer " & token
```

## Recomendaciones

1. **Usa el endpoint de lote** para sincronizar múltiples registros (más eficiente)
2. **Maneja errores** apropiadamente en VB6
3. **Guarda el estado de sincronización** en tu DB de VB6 para saber qué ya fue enviado
4. **Sincroniza periódicamente** (por ejemplo, cada hora o al cerrar el día)
5. **Valida los datos** antes de enviarlos para evitar errores

## Campos Mínimos Requeridos

### Categoría
- `id_empresa` (requerido)
- `codvb6` (requerido)
- `nombre_categoria` (requerido)

### Producto
- `id_empresa` (requerido)
- `codvb6` (requerido)
- `codigo_producto` (requerido)
- `nombre_producto` (requerido)
- `precio_venta` (requerido)

### Cliente
- `id_empresa` (requerido)
- `codvb6` (requerido)
- `nombre_razon_social` (requerido)

### Proveedor
- `id_empresa` (requerido)
- `codvb6` (requerido)
- `razon_social` (requerido)

## Manejo Multi-Empresa

El campo `id_empresa` es crítico. Cada registro debe tener el `id_empresa` correcto. Las validaciones garantizan que:
- Cada `codvb6` es único por empresa
- No hay conflictos entre empresas diferentes
- Los datos están correctamente aislados

## Soporte

Si encuentras algún error o necesitas ayuda, verifica:
1. Que el token JWT sea válido
2. Que el `id_empresa` exista
3. Que el formato JSON sea correcto
4. Los logs de Laravel en `storage/logs/lumen.log`
