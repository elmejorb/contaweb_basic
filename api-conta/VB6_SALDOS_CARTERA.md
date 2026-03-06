# API de Saldos de Cartera para VB6

## Endpoint
**POST** `http://localhost:8000/sync/saldos/batch`

## Descripción
Este endpoint permite sincronizar saldos de cartera de clientes o proveedores desde VB6 en lotes de hasta 500 registros.

---

## Formato del Request

### Headers
```
Content-Type: application/json
```

### Body JSON
```json
{
  "email": "usuario@ejemplo.com",
  "token_api": "tu_token_api_de_la_empresa",
  "tipo": "cliente",
  "registros": [
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
}
```

### Campos Requeridos

#### Nivel Principal:
- **email** (string, requerido): Email del usuario que realiza la sincronización
- **token_api** (string, requerido): Token API de la empresa
- **tipo** (string, requerido): Tipo de tercero, valores permitidos:
  - `"cliente"` para cartera de clientes
  - `"proveedor"` para cartera de proveedores
- **registros** (array, requerido): Array de registros a sincronizar (mínimo 1, máximo 500)

#### Cada Registro:
- **codigo** (string, requerido): Código del cliente o proveedor (máximo 50 caracteres)
- **nombre** (string, requerido): Nombre o razón social del tercero (máximo 255 caracteres)
- **saldo** (numeric, requerido): Saldo actual de la cartera

---

## Respuestas

### Respuesta Exitosa (200 OK)
```json
{
  "error": false,
  "mensaje": "Lote procesado exitosamente",
  "resultado": {
    "insertados": 10,
    "actualizados": 4,
    "total_procesados": 14,
    "errores": 0,
    "detalles_errores": []
  }
}
```

### Respuesta con Errores Parciales (200 OK)
```json
{
  "error": false,
  "mensaje": "Lote procesado exitosamente",
  "resultado": {
    "insertados": 12,
    "actualizados": 2,
    "total_procesados": 14,
    "errores": 2,
    "detalles_errores": [
      "Registro 5: Falta el código",
      "Registro 8: Saldo inválido"
    ]
  }
}
```

### Error de Validación (422)
```json
{
  "error": true,
  "mensaje": "Datos inválidos",
  "errores": {
    "email": ["El campo email es obligatorio"],
    "tipo": ["El campo tipo debe ser cliente o proveedor"],
    "registros": ["El campo registros debe contener al menos 1 elemento"]
  }
}
```

### Error de Autenticación (401)
```json
{
  "error": true,
  "mensaje": "Credenciales inválidas - Usuario no encontrado"
}
```

o

```json
{
  "error": true,
  "mensaje": "Credenciales inválidas - Token API no encontrado"
}
```

### Error de Autorización (403)
```json
{
  "error": true,
  "mensaje": "El usuario no tiene acceso a esta empresa"
}
```

### Error del Servidor (500)
```json
{
  "error": true,
  "mensaje": "Error al procesar lote: [detalle del error]"
}
```

---

## Lógica de Actualización

El sistema utiliza `updateOrCreate`, lo que significa:

1. **Si el registro existe** (mismo `id_empresa`, `codigo_tercero` y `tipo`):
   - Se actualiza el `nombre_tercero` y `saldo_total`
   - Se cuenta como "actualizado"

2. **Si el registro NO existe**:
   - Se crea un nuevo registro
   - Se cuenta como "insertado"

3. **No se crean duplicados**: La combinación de empresa + código + tipo es única

---

## Ejemplo de Código VB6

```vb
Private Sub SincronizarSaldosCartera()
    Dim objHTTP As Object
    Dim strURL As String
    Dim strJSON As String
    Dim strResponse As String

    ' Crear objeto HTTP
    Set objHTTP = CreateObject("MSXML2.ServerXMLHTTP.6.0")

    ' URL del endpoint
    strURL = "http://localhost:8000/sync/saldos/batch"

    ' Construir JSON
    strJSON = "{" & _
              """email"": ""usuario@ejemplo.com""," & _
              """token_api"": ""tu_token_api""," & _
              """tipo"": ""cliente""," & _
              """registros"": [" & _
                "{""codigo"": ""130843"", ""nombre"": ""EVER HERNANDEZ"", ""saldo"": 1107716.00}," & _
                "{""codigo"": ""130807"", ""nombre"": ""NILSON GONZALES"", ""saldo"": 1004646.00}," & _
                "{""codigo"": ""130802"", ""nombre"": ""EMIRO MONTES DIAZ"", ""saldo"": 988330.00}" & _
              "]" & _
              "}"

    ' Configurar y enviar request
    objHTTP.Open "POST", strURL, False
    objHTTP.setRequestHeader "Content-Type", "application/json"
    objHTTP.send strJSON

    ' Obtener respuesta
    strResponse = objHTTP.responseText

    ' Procesar respuesta
    Debug.Print strResponse

    ' Liberar objeto
    Set objHTTP = Nothing
End Sub
```

---

## Ejemplo Completo con Datos de la Imagen

Basado en la imagen que proporcionaste, el JSON sería:

```json
{
  "email": "tu_email@ejemplo.com",
  "token_api": "tu_token_api",
  "tipo": "cliente",
  "registros": [
    {"codigo": "130843", "nombre": "EVER HERNANDEZ", "saldo": 1107716.00},
    {"codigo": "130807", "nombre": "NILSON GONZALES", "saldo": 1004646.00},
    {"codigo": "130802", "nombre": "EMIRO MONTES DIAZ", "saldo": 988330.00},
    {"codigo": "130721", "nombre": "SERGIO LUIS BERONA", "saldo": 881000.00},
    {"codigo": "130806", "nombre": "JUAN GUILLERMO PASTRANA", "saldo": 833728.00},
    {"codigo": "130827", "nombre": "RAFAEL MONTERROZA", "saldo": 762700.00},
    {"codigo": "130735", "nombre": "GUSTAVO SOLANO BERONA", "saldo": 760546.00},
    {"codigo": "130845", "nombre": "JULIAN PADILLA", "saldo": 753460.00},
    {"codigo": "130558", "nombre": "JOSE LUIS PASTRANA", "saldo": 739425.00},
    {"codigo": "130606", "nombre": "CARMEN VERTEL", "saldo": 726062.00},
    {"codigo": "130715", "nombre": "JOSE LUIS TUIRAN", "saldo": 681400.00},
    {"codigo": "130836", "nombre": "GABRIEL SERPA", "saldo": 678530.00},
    {"codigo": "130841", "nombre": "OSWALDO BRAVO", "saldo": 640518.00},
    {"codigo": "130844", "nombre": "JOSE ELIECER ARRIETA", "saldo": 638573.00}
  ]
}
```

---

## Notas Importantes

1. **Límite de registros**: Puedes enviar hasta 500 registros por petición
2. **Transaccionalidad**: Si un registro falla, los demás se procesan normalmente
3. **Validación**: Cada registro se valida individualmente
4. **Tipo de tercero**: Puedes enviar clientes o proveedores, pero no ambos en la misma petición
5. **Autenticación**: El usuario debe tener acceso a la empresa asociada al token_api

---

## Errores Comunes

### "El sistema no puede encontrar el recurso especificado"
- **Causa**: La URL no existe o está mal escrita
- **Solución**: Verifica que estés usando `/sync/saldos/batch` (no `/saldos/vb6/batch`)

### "Credenciales inválidas"
- **Causa**: Email o token_api incorrectos
- **Solución**: Verifica que el email y token_api sean correctos y existan en la base de datos

### "El usuario no tiene acceso a esta empresa"
- **Causa**: El usuario no está asociado a la empresa del token_api
- **Solución**: Verifica en la tabla `usuarios_empresas` que existe la relación

### "Saldo inválido"
- **Causa**: El campo saldo no es numérico o está vacío
- **Solución**: Asegúrate de enviar el saldo como número (no string)
