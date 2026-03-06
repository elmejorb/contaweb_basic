# Enviar Categorías desde Visual Basic 6

## Endpoint Específico para Categorías

**POST** `/api/categorias/vb6`

Este endpoint recibe categorías desde VB6 con una estructura simplificada:
- `id_empresa` (requerido)
- `codigo` (requerido) - Se guarda como `codvb6` en la base de datos
- `nombre_categoria` (requerido)
- `descripcion_categoria` (opcional)
- `estado` (opcional, default: 1/true)

## Funcionamiento

- Si el `codigo` ya existe para esa `id_empresa`: **ACTUALIZA** la categoría
- Si el `codigo` NO existe: **CREA** una nueva categoría
- Esto evita duplicados automáticamente

## Ejemplo JSON

```json
{
  "id_empresa": 1,
  "codigo": "CAT001",
  "nombre_categoria": "Electrónica",
  "descripcion_categoria": "Productos electrónicos y tecnología"
}
```

## Respuestas del Servidor

### Cuando se CREA una categoría nueva:
```json
{
  "error": false,
  "mensaje": "Categoría creada desde VB6",
  "accion": "creada",
  "categoria": {
    "id_categoria": 5,
    "id_empresa": 1,
    "codvb6": "CAT001",
    "nombre_categoria": "Electrónica",
    "descripcion_categoria": "Productos electrónicos y tecnología",
    "estado": 1,
    "created_at": "2025-11-21T10:30:00.000000Z",
    "updated_at": "2025-11-21T10:30:00.000000Z"
  }
}
```

### Cuando se ACTUALIZA una categoría existente:
```json
{
  "error": false,
  "mensaje": "Categoría actualizada desde VB6",
  "accion": "actualizada",
  "categoria": {
    "id_categoria": 5,
    "id_empresa": 1,
    "codvb6": "CAT001",
    "nombre_categoria": "Electrónica y Computación",
    "descripcion_categoria": "Productos electrónicos y tecnología",
    "estado": 1,
    "created_at": "2025-11-21T10:30:00.000000Z",
    "updated_at": "2025-11-21T10:35:00.000000Z"
  }
}
```

### Cuando hay un error:
```json
{
  "error": true,
  "mensaje": "Datos inválidos",
  "errores": {
    "codigo": ["El campo codigo es obligatorio."],
    "nombre_categoria": ["El campo nombre categoria es obligatorio."]
  }
}
```

## Código VB6 - Función Completa

```vb
Option Explicit

' Constantes de configuración
Private Const API_URL As String = "http://localhost:8000/api"
Private Const ID_EMPRESA As Long = 1

' Variable global para el token JWT
Public g_TokenJWT As String

' Función para hacer login y obtener el token
Public Function LoginAPI(email As String, password As String) As Boolean
    Dim http As Object
    Dim url As String
    Dim jsonData As String
    Dim response As String

    Set http = CreateObject("MSXML2.XMLHTTP")
    url = API_URL & "/login"

    ' Construir JSON de login
    jsonData = "{" & _
        """email"":""" & email & """," & _
        """password"":""" & password & """" & _
        "}"

    ' Hacer petición
    http.Open "POST", url, False
    http.setRequestHeader "Content-Type", "application/json"
    http.send jsonData

    If http.Status = 200 Then
        ' Parsear respuesta JSON para obtener el token
        response = http.responseText
        ' Aquí deberías usar un parser JSON, pero por simplicidad:
        ' Buscar "token":"valor"
        Dim posInicio As Long
        Dim posFin As Long
        posInicio = InStr(response, """token"":""") + 9
        posFin = InStr(posInicio, response, """")

        If posInicio > 9 And posFin > posInicio Then
            g_TokenJWT = Mid(response, posInicio, posFin - posInicio)
            LoginAPI = True
            MsgBox "Login exitoso", vbInformation
        Else
            LoginAPI = False
            MsgBox "Error al obtener token", vbCritical
        End If
    Else
        LoginAPI = False
        MsgBox "Error en login: " & http.responseText, vbCritical
    End If

    Set http = Nothing
End Function

' Función para enviar una categoría
Public Function EnviarCategoria(codigo As String, nombre As String, Optional descripcion As String = "") As Boolean
    Dim http As Object
    Dim url As String
    Dim jsonData As String
    Dim response As String

    ' Verificar que tenemos token
    If g_TokenJWT = "" Then
        MsgBox "Debe hacer login primero", vbExclamation
        EnviarCategoria = False
        Exit Function
    End If

    Set http = CreateObject("MSXML2.XMLHTTP")
    url = API_URL & "/categorias/vb6"

    ' Construir JSON - Escape de comillas en los valores
    Dim nombreEscape As String
    Dim descripcionEscape As String
    nombreEscape = Replace(nombre, """", "\""")
    descripcionEscape = Replace(descripcion, """", "\""")

    jsonData = "{" & _
        """id_empresa"":" & ID_EMPRESA & "," & _
        """codigo"":""" & codigo & """," & _
        """nombre_categoria"":""" & nombreEscape & """"

    If descripcion <> "" Then
        jsonData = jsonData & "," & _
            """descripcion_categoria"":""" & descripcionEscape & """"
    End If

    jsonData = jsonData & "}"

    ' Hacer petición
    http.Open "POST", url, False
    http.setRequestHeader "Content-Type", "application/json"
    http.setRequestHeader "Authorization", "Bearer " & g_TokenJWT
    http.send jsonData

    If http.Status = 200 Or http.Status = 201 Then
        response = http.responseText

        ' Ver si fue creada o actualizada
        If InStr(response, """accion"":""creada""") > 0 Then
            MsgBox "Categoría CREADA exitosamente: " & nombre, vbInformation
        ElseIf InStr(response, """accion"":""actualizada""") > 0 Then
            MsgBox "Categoría ACTUALIZADA exitosamente: " & nombre, vbInformation
        Else
            MsgBox "Categoría sincronizada: " & nombre, vbInformation
        End If

        EnviarCategoria = True
    Else
        MsgBox "Error al enviar categoría:" & vbCrLf & http.responseText, vbCritical
        EnviarCategoria = False
    End If

    Set http = Nothing
End Function

' Función para sincronizar todas las categorías
Public Function SincronizarTodasLasCategorias() As Boolean
    Dim rs As ADODB.Recordset
    Dim sql As String
    Dim totalCategorias As Long
    Dim categoriasEnviadas As Long
    Dim categoriasError As Long

    Set rs = New ADODB.Recordset

    ' Obtener categorías de tu base de datos VB6
    sql = "SELECT cod_categoria, nombre_categoria, descripcion_categoria " & _
          "FROM categorias " & _
          "WHERE activo = 1 " & _
          "ORDER BY cod_categoria"

    rs.Open sql, g_Conexion, adOpenStatic, adLockReadOnly

    If rs.EOF Then
        MsgBox "No hay categorías para sincronizar", vbInformation
        SincronizarTodasLasCategorias = False
        Exit Function
    End If

    totalCategorias = rs.RecordCount
    categoriasEnviadas = 0
    categoriasError = 0

    ' Recorrer todas las categorías
    Do While Not rs.EOF
        Dim codigo As String
        Dim nombre As String
        Dim descripcion As String

        codigo = Trim(rs("cod_categoria") & "")
        nombre = Trim(rs("nombre_categoria") & "")
        descripcion = Trim(rs("descripcion_categoria") & "")

        ' Enviar categoría
        If EnviarCategoria(codigo, nombre, descripcion) Then
            categoriasEnviadas = categoriasEnviadas + 1

            ' Opcional: Marcar como sincronizada en tu BD VB6
            ' Ejecutar UPDATE para poner fecha_sincronizacion = Now()
        Else
            categoriasError = categoriasError + 1
        End If

        ' Mostrar progreso
        DoEvents

        rs.MoveNext
    Loop

    rs.Close
    Set rs = Nothing

    ' Mostrar resumen
    MsgBox "Sincronización completada:" & vbCrLf & _
           "Total: " & totalCategorias & vbCrLf & _
           "Enviadas: " & categoriasEnviadas & vbCrLf & _
           "Errores: " & categoriasError, vbInformation

    SincronizarTodasLasCategorias = (categoriasError = 0)
End Function

' Ejemplo de uso en un botón
Private Sub btnSincronizarCategorias_Click()
    ' Primero hacer login
    If LoginAPI("admin@empresa.com", "password123") Then
        ' Luego sincronizar categorías
        Call SincronizarTodasLasCategorias
    End If
End Sub

' Ejemplo de enviar una sola categoría
Private Sub btnEnviarCategoria_Click()
    If g_TokenJWT = "" Then
        MsgBox "Debe hacer login primero"
        Exit Sub
    End If

    Call EnviarCategoria("CAT001", "Electrónica", "Productos electrónicos")
End Sub
```

## Ejemplo Simplificado (Una sola función)

Si prefieres una función más simple:

```vb
Public Function EnviarCategoriaSimple(token As String, codigo As String, nombre As String) As Boolean
    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP")

    Dim jsonData As String
    jsonData = "{""id_empresa"":1,""codigo"":""" & codigo & """,""nombre_categoria"":""" & nombre & """}"

    http.Open "POST", "http://localhost:8000/api/categorias/vb6", False
    http.setRequestHeader "Content-Type", "application/json"
    http.setRequestHeader "Authorization", "Bearer " & token
    http.send jsonData

    EnviarCategoriaSimple = (http.Status = 200 Or http.Status = 201)

    If Not EnviarCategoriaSimple Then
        Debug.Print "Error: " & http.responseText
    End If

    Set http = Nothing
End Function
```

## Notas Importantes

1. **Autenticación**: Debes hacer login primero y guardar el token JWT
2. **Token expira**: Si el servidor devuelve error 401, necesitas hacer login nuevamente
3. **Escape de caracteres**: Asegúrate de escapar comillas dobles en los valores
4. **Manejo de errores**: Verifica siempre el código HTTP de respuesta
5. **ID Empresa**: Cambia el valor de `ID_EMPRESA` según tu empresa
6. **URL del servidor**: Cambia `localhost:8000` por tu servidor real en producción

## Campos Opcionales

Puedes agregar estos campos adicionales en el JSON si los necesitas:
- `estado`: true/false (default: true)
- `descripcion_categoria`: texto descriptivo

## Próximos Pasos

Una vez que funcione con categorías, puedes crear funciones similares para:
- Productos
- Clientes
- Proveedores

El mismo patrón se puede aplicar a todos los módulos.
