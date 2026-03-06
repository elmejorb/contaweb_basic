<?php

/*
|--------------------------------------------------------------------------
| Rutas de Sincronización
|--------------------------------------------------------------------------
|
| Rutas para recibir datos sincronizados desde la base de datos local
|
*/

$router->group(['prefix' => 'api/sync'], function () use ($router) {

    // Validar credenciales de sincronización (email + token_api)
    $router->post('/validar', 'EmpresaController@validarSincronizacion');

    // Sincronizar categorías (DEPRECATED - usar /api/sync/categorias en web.php)
    // $router->post('/categorias', 'SyncController@syncCategorias');

    // Sincronizar productos (DEPRECATED - usar /api/sync/productos en web.php)
    // $router->post('/productos', 'SyncController@syncProductos');

    // Sincronizar clientes
    $router->post('/clientes', 'SyncController@syncClientes');

    // Sincronizar proveedores
    $router->post('/proveedores', 'SyncController@syncProveedores');

    // Sincronizar ventas
    $router->post('/ventas', 'SyncController@syncVentas');

    // Sincronizar detalles de venta
    $router->post('/detalles_venta', 'SyncController@syncDetallesVenta');

    // Sincronizar compras (pedidos)
    $router->post('/compras', 'SyncController@syncCompras');

    // Sincronizar detalles de compra
    $router->post('/detalles_compra', 'SyncController@syncDetallesCompra');

    // Sincronizar gastos
    $router->post('/gastos', 'SyncController@syncGastos');

    // Sincronizar arqueos de caja
    $router->post('/arqueos_caja', 'SyncController@syncArqueosCaja');

    // Sincronizar cartera de clientes
    $router->post('/cartera_clientes', 'SyncController@syncCarteraClientes');
});
