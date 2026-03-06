<?php

/** @var \Laravel\Lumen\Routing\Router $router */

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It is a breeze. Simply tell Lumen the URIs it should respond to
| and give it the Closure to call when that URI is requested.
|
*/

$router->get('/', function () use ($router) {
    return $router->app->version();
});

// Ruta de validacion para Sincronizador Electron (JSON)
$router->post('/sync/electron/validar', 'SyncElectronController@validar');

// Rutas públicas para sincronización VB6 (sin prefijo api)
$router->post('/sync/validar', 'EmpresaController@validarSincronizacion');
$router->post('/sync/categorias', 'CategoriaController@recibirDesdeVB6');
$router->post('/sync/productos', 'ProductoController@recibirDesdeVB6');
$router->post('/sync/clientes', 'ClienteController@recibirDesdeVB6');
$router->post('/sync/proveedores', 'ProveedorController@recibirDesdeVB6');
$router->post('/sync/ventas', 'VentaController@recibirDesdeVB6');
$router->post('/sync/cierres-caja', 'CierreCajaController@recibirDesdeVB6');

// Rutas para sincronización por lotes (batch) - más rápido
$router->post('/sync/categorias/batch', 'CategoriaController@recibirLoteDesdeVB6');
$router->post('/sync/productos/batch', 'ProductoController@recibirLoteDesdeVB6');
$router->post('/sync/clientes/batch', 'ClienteController@recibirLoteDesdeVB6');
$router->post('/sync/proveedores/batch', 'ProveedorController@recibirLoteDesdeVB6');
$router->post('/sync/ventas/batch', 'VentaController@recibirLoteDesdeVB6');
$router->post('/sync/cierres-caja/batch', 'CierreCajaController@recibirLoteDesdeVB6');
$router->post('/sync/saldos/batch', 'SaldoCarteraController@recibirLoteDesdeVB6');

$router->post('/sync/pagos/batch', 'PagoController@recibirLoteDesdeVB6');

// Rutas alias para compatibilidad con VB6 (rutas antiguas)
$router->post('/controlcaja/vb6/batch', 'CierreCajaController@recibirLoteDesdeVB6');
$router->post('/saldos/vb6/batch', 'SaldoCarteraController@recibirLoteDesdeVB6');
$router->post('/sync/pagos/vb6/batch', 'PagoController@recibirLoteDesdeVB6');
$router->post('/proveedores/vb6/batch', 'ProveedorController@recibirLoteDesdeVB6');

// API Routes
$router->group(['prefix' => 'api'], function () use ($router) {
    // Ruta de prueba
    $router->get('/test', function () {
        return response()->json([
            'message' => 'API funcionando correctamente',
            'status' => 'success',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    });

    // Rutas de autenticación (públicas)
    $router->post('/login', 'AuthController@login');
    $router->post('/registro', 'AuthController@registro');

    // Rutas públicas de CRM (sin autenticación)
    $router->post('/crm/validar-token', 'EmpresaController@validarTokenCRM');

    // Rutas protegidas con JWT
    $router->group(['middleware' => 'auth'], function () use ($router) {
        $router->get('/me', 'AuthController@me');
        $router->post('/logout', 'AuthController@logout');
        $router->post('/refresh', 'AuthController@refresh');
        $router->put('/perfil', 'AuthController@actualizarPerfil');
        $router->put('/perfil/email', 'AuthController@actualizarEmail');
        $router->put('/perfil/password', 'AuthController@cambiarPassword');
        $router->post('/perfil/foto', 'AuthController@subirFotoPerfil');
        $router->delete('/perfil/foto', 'AuthController@eliminarFotoPerfil');

        // Rutas de Empresas
        $router->get('/empresas/mis-empresas', 'EmpresaController@misEmpresas');
        $router->post('/empresas', 'EmpresaController@crear');
        $router->get('/empresas/{id}', 'EmpresaController@obtener');
        $router->put('/empresas/{id}', 'EmpresaController@actualizar');
        $router->post('/empresas/{id}/regenerar-token', 'EmpresaController@regenerarToken');
        $router->get('/empresas/{id}/token', 'EmpresaController@obtenerToken');
        $router->post('/empresas/{id}/logo', 'EmpresaController@subirLogo');
        $router->delete('/empresas/{id}/logo', 'EmpresaController@eliminarLogo');

        // Rutas de CRM y planes (requieren autenticación)
        $router->post('/empresas/crear-con-crm', 'EmpresaController@crearConCRM');
        $router->post('/empresas/{id}/actualizar-plan', 'EmpresaController@actualizarPlanDesdeCRM');
        $router->post('/empresas/{id}/verificar-modulo', 'EmpresaController@verificarAccesoModulo');
        $router->post('/empresas/{id}/sincronizar-crm', 'EmpresaController@sincronizarConCRM');

        // Rutas de Usuarios de Empresa
        $router->get('/empresas/{empresaId}/usuarios', 'UsuarioEmpresaController@listar');
        $router->post('/empresas/{empresaId}/usuarios', 'UsuarioEmpresaController@crear');
        $router->put('/empresas/{empresaId}/usuarios/{usuarioId}', 'UsuarioEmpresaController@actualizar');
        $router->post('/empresas/{empresaId}/usuarios/{usuarioId}/estado', 'UsuarioEmpresaController@cambiarEstado');
        $router->delete('/empresas/{empresaId}/usuarios/{usuarioId}', 'UsuarioEmpresaController@eliminar');
        $router->get('/tipos-usuario', 'UsuarioEmpresaController@tiposUsuario');

        // Rutas de Cartera (Saldos)
        $router->get('/cartera/clientes', 'SaldoCarteraController@listarClientes');
        $router->get('/cartera/proveedores', 'SaldoCarteraController@listarProveedores');
        $router->post('/cartera/clientes/sincronizar', 'SaldoCarteraController@sincronizarClientes');
        $router->post('/cartera/proveedores/sincronizar', 'SaldoCarteraController@sincronizarProveedores');
        $router->get('/cartera/resumen', 'SaldoCarteraController@resumen');
        $router->delete('/cartera/{id}', 'SaldoCarteraController@eliminar');

        // Rutas de Categorías
        $router->get('/categorias', 'CategoriaController@index');
        $router->post('/categorias', 'CategoriaController@store');
        $router->post('/categorias/vb6', 'CategoriaController@recibirDesdeVB6');
        $router->get('/categorias/{id}', 'CategoriaController@show');
        $router->put('/categorias/{id}', 'CategoriaController@update');
        $router->delete('/categorias/{id}', 'CategoriaController@destroy');
        $router->post('/categorias/{id}/restore', 'CategoriaController@restore');

        // Rutas de Impuestos
        $router->get('/impuestos', 'ImpuestoController@index');
        $router->post('/impuestos', 'ImpuestoController@store');
        $router->get('/impuestos/{id}', 'ImpuestoController@show');
        $router->put('/impuestos/{id}', 'ImpuestoController@update');
        $router->delete('/impuestos/{id}', 'ImpuestoController@destroy');
        $router->post('/impuestos/{id}/restore', 'ImpuestoController@restore');

        // Rutas de Unidades de Medida (Solo lectura)
        $router->get('/unidades-medida', 'UnidadMedidaController@index');
        $router->get('/unidades-medida/todas', 'UnidadMedidaController@todas');
        $router->get('/unidades-medida/{id}', 'UnidadMedidaController@show');
        $router->get('/unidades-medida/codigo/{codigo}', 'UnidadMedidaController@buscarPorCodigo');

        // Rutas de Productos
        $router->get('/productos', 'ProductoController@index');
        $router->post('/productos', 'ProductoController@store');
        $router->get('/productos/estadisticas', 'ProductoController@estadisticas');
        $router->get('/productos/diagnostico', 'ProductoController@diagnostico');
        $router->get('/productos/{id}', 'ProductoController@show');
        $router->put('/productos/{id}', 'ProductoController@update');
        $router->delete('/productos/{id}', 'ProductoController@destroy');
        $router->post('/productos/{id}/restore', 'ProductoController@restore');
        $router->post('/productos/buscar-codigo', 'ProductoController@buscarPorCodigo');

        // Rutas de Clientes
        $router->get('/clientes', 'ClienteController@index');
        $router->post('/clientes', 'ClienteController@store');
        $router->get('/clientes/{id}', 'ClienteController@show');
        $router->put('/clientes/{id}', 'ClienteController@update');
        $router->delete('/clientes/{id}', 'ClienteController@destroy');

        // Rutas de Proveedores
        $router->get('/proveedores', 'ProveedorController@listar');
        $router->post('/proveedores', 'ProveedorController@crear');
        $router->get('/proveedores/{id}', 'ProveedorController@obtener');
        $router->put('/proveedores/{id}', 'ProveedorController@actualizar');
        $router->delete('/proveedores/{id}', 'ProveedorController@eliminar');

        // Rutas de Catálogos
        $router->get('/catalogos/tipos-documentos', 'CatalogoController@tiposDocumentos');
        $router->get('/catalogos/tipos-responsabilidades', 'CatalogoController@tiposResponsabilidades');
        $router->get('/catalogos/tipos-organizaciones', 'CatalogoController@tiposOrganizaciones');
        $router->get('/catalogos/regimenes-tributarios', 'CatalogoController@regimenesTributarios');
        $router->get('/catalogos/todos', 'CatalogoController@todos');

        // Rutas de Sincronización VB6
        $router->post('/sync-vb6/categoria', 'SincronizacionVB6Controller@sincronizarCategoria');
        $router->post('/sync-vb6/producto', 'SincronizacionVB6Controller@sincronizarProducto');
        $router->post('/sync-vb6/cliente', 'SincronizacionVB6Controller@sincronizarCliente');
        $router->post('/sync-vb6/proveedor', 'SincronizacionVB6Controller@sincronizarProveedor');
        $router->post('/sync-vb6/lote', 'SincronizacionVB6Controller@sincronizarLote');

        // Rutas de Cierres de Caja
        $router->get('/cierres-caja', 'CierreCajaController@index');
        $router->post('/cierres-caja', 'CierreCajaController@store');
        $router->get('/cierres-caja/resumen-vendedores', 'CierreCajaController@resumenPorVendedor');
        $router->get('/cierres-caja/activa', 'CierreCajaController@cajaActiva');
        $router->get('/cierres-caja/resumen-actual', 'CierreCajaController@resumenCajaActual');
        $router->post('/cierres-caja/abrir', 'CierreCajaController@abrirCaja');
        $router->get('/cierres-caja/{id}', 'CierreCajaController@show');
        $router->put('/cierres-caja/{id}', 'CierreCajaController@update');
        $router->post('/cierres-caja/{id}/cerrar', 'CierreCajaController@cerrar');
        $router->post('/cierres-caja/{id}/cerrar-completo', 'CierreCajaController@cerrarCajaCompleto');
        $router->post('/cierres-caja/{id}/aprobar', 'CierreCajaController@aprobar');

        // Rutas de Ventas
        $router->get('/ventas', 'VentaController@listar');
        $router->get('/ventas/resumen', 'VentaController@resumen');
        $router->get('/ventas/reporte-mensual', 'VentaController@reporteMensual');
        $router->get('/ventas/ranking-clientes', 'VentaController@rankingClientes');
        $router->get('/ventas/comparativo', 'VentaController@comparativo');

        // Rutas de Pagos
        $router->get('/pagos', 'PagoController@listar');

        // Rutas de Movimientos de Caja
        $router->get('/movimientos-caja', 'CierreCajaController@listarMovimientos');
        $router->post('/movimientos-caja', 'CierreCajaController@crearMovimiento');
        $router->post('/movimientos-caja/{id}/anular', 'CierreCajaController@anularMovimiento');
    });
});
