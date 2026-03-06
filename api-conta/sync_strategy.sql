-- ========================================
-- ESTRATEGIA DE SINCRONIZACIÓN EFICIENTE
-- ========================================

-- 1. Crear tabla de control de cambios en la BD LOCAL (conta_mercaya2)
USE conta_mercaya2;

CREATE TABLE IF NOT EXISTS tbl_sync_queue (
    id_sync INT AUTO_INCREMENT PRIMARY KEY,
    tabla VARCHAR(50) NOT NULL,
    id_registro INT NOT NULL,
    operacion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sincronizado TINYINT(1) DEFAULT 0,
    fecha_sincronizacion DATETIME NULL,
    intentos INT DEFAULT 0,
    ultimo_error TEXT NULL,
    datos_json TEXT NULL, -- Para almacenar el registro completo en DELETE
    INDEX idx_sincronizado (sincronizado),
    INDEX idx_tabla_id (tabla, id_registro),
    INDEX idx_fecha (fecha_cambio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================
-- 2. TRIGGERS PARA CADA TABLA IMPORTANTE
-- ========================================

-- TRIGGER PARA tblarticulos
DELIMITER $$

-- INSERT
CREATE TRIGGER trg_articulos_insert AFTER INSERT ON tblarticulos
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion, datos_json)
    VALUES ('tblarticulos', NEW.Items, 'INSERT', NULL);
END$$

-- UPDATE
CREATE TRIGGER trg_articulos_update AFTER UPDATE ON tblarticulos
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion, datos_json)
    VALUES ('tblarticulos', NEW.Items, 'UPDATE', NULL);
END$$

-- DELETE
CREATE TRIGGER trg_articulos_delete BEFORE DELETE ON tblarticulos
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion, datos_json)
    VALUES ('tblarticulos', OLD.Items, 'DELETE',
        JSON_OBJECT(
            'Items', OLD.Items,
            'Codigo', OLD.Codigo,
            'Nombres_Articulo', OLD.Nombres_Articulo
        )
    );
END$$

-- TRIGGER PARA tblcategoria
CREATE TRIGGER trg_categoria_insert AFTER INSERT ON tblcategoria
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion)
    VALUES ('tblcategoria', NEW.Id_Categoria, 'INSERT');
END$$

CREATE TRIGGER trg_categoria_update AFTER UPDATE ON tblcategoria
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion)
    VALUES ('tblcategoria', NEW.Id_Categoria, 'UPDATE');
END$$

CREATE TRIGGER trg_categoria_delete BEFORE DELETE ON tblcategoria
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion, datos_json)
    VALUES ('tblcategoria', OLD.Id_Categoria, 'DELETE',
        JSON_OBJECT('Id_Categoria', OLD.Id_Categoria, 'Categoria', OLD.Categoria)
    );
END$$

-- TRIGGER PARA tblclientes
CREATE TRIGGER trg_clientes_insert AFTER INSERT ON tblclientes
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion)
    VALUES ('tblclientes', NEW.CodigoClien, 'INSERT');
END$$

CREATE TRIGGER trg_clientes_update AFTER UPDATE ON tblclientes
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion)
    VALUES ('tblclientes', NEW.CodigoClien, 'UPDATE');
END$$

CREATE TRIGGER trg_clientes_delete BEFORE DELETE ON tblclientes
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion, datos_json)
    VALUES ('tblclientes', OLD.CodigoClien, 'DELETE',
        JSON_OBJECT('CodigoClien', OLD.CodigoClien, 'Nombres', OLD.Nombres)
    );
END$$

-- TRIGGER PARA tblventas
CREATE TRIGGER trg_ventas_insert AFTER INSERT ON tblventas
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion)
    VALUES ('tblventas', NEW.Factura_N, 'INSERT');
END$$

CREATE TRIGGER trg_ventas_update AFTER UPDATE ON tblventas
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion)
    VALUES ('tblventas', NEW.Factura_N, 'UPDATE');
END$$

CREATE TRIGGER trg_ventas_delete BEFORE DELETE ON tblventas
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion, datos_json)
    VALUES ('tblventas', OLD.Factura_N, 'DELETE',
        JSON_OBJECT('Factura_N', OLD.Factura_N, 'Fecha', OLD.Fecha)
    );
END$$

-- TRIGGER PARA tbldetalle_venta
CREATE TRIGGER trg_detalle_venta_insert AFTER INSERT ON tbldetalle_venta
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion, datos_json)
    VALUES ('tbldetalle_venta', NEW.Id_DetalleVenta, 'INSERT',
        JSON_OBJECT('Factura_N', NEW.Factura_N)
    );
END$$

CREATE TRIGGER trg_detalle_venta_update AFTER UPDATE ON tbldetalle_venta
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion, datos_json)
    VALUES ('tbldetalle_venta', NEW.Id_DetalleVenta, 'UPDATE',
        JSON_OBJECT('Factura_N', NEW.Factura_N)
    );
END$$

CREATE TRIGGER trg_detalle_venta_delete BEFORE DELETE ON tbldetalle_venta
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion, datos_json)
    VALUES ('tbldetalle_venta', OLD.Id_DetalleVenta, 'DELETE',
        JSON_OBJECT('Factura_N', OLD.Factura_N, 'Items', OLD.Items)
    );
END$$

-- TRIGGER PARA tblproveedores
CREATE TRIGGER trg_proveedores_insert AFTER INSERT ON tblproveedores
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion)
    VALUES ('tblproveedores', NEW.CodigoPro, 'INSERT');
END$$

CREATE TRIGGER trg_proveedores_update AFTER UPDATE ON tblproveedores
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion)
    VALUES ('tblproveedores', NEW.CodigoPro, 'UPDATE');
END$$

CREATE TRIGGER trg_proveedores_delete BEFORE DELETE ON tblproveedores
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion, datos_json)
    VALUES ('tblproveedores', OLD.CodigoPro, 'DELETE',
        JSON_OBJECT('CodigoPro', OLD.CodigoPro, 'Proveedor', OLD.Proveedor)
    );
END$$

-- TRIGGER PARA tblegresos
CREATE TRIGGER trg_egresos_insert AFTER INSERT ON tblegresos
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion)
    VALUES ('tblegresos', NEW.Id_Egresos, 'INSERT');
END$$

CREATE TRIGGER trg_egresos_update AFTER UPDATE ON tblegresos
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion)
    VALUES ('tblegresos', NEW.Id_Egresos, 'UPDATE');
END$$

CREATE TRIGGER trg_egresos_delete BEFORE DELETE ON tblegresos
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion, datos_json)
    VALUES ('tblegresos', OLD.Id_Egresos, 'DELETE',
        JSON_OBJECT('Id_Egresos', OLD.Id_Egresos, 'Concepto', OLD.Concepto)
    );
END$$

-- TRIGGER PARA tblpedidos
CREATE TRIGGER trg_pedidos_insert AFTER INSERT ON tblpedidos
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion)
    VALUES ('tblpedidos', NEW.Id_Pedido, 'INSERT');
END$$

CREATE TRIGGER trg_pedidos_update AFTER UPDATE ON tblpedidos
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion)
    VALUES ('tblpedidos', NEW.Id_Pedido, 'UPDATE');
END$$

CREATE TRIGGER trg_pedidos_delete BEFORE DELETE ON tblpedidos
FOR EACH ROW
BEGIN
    INSERT INTO tbl_sync_queue (tabla, id_registro, operacion, datos_json)
    VALUES ('tblpedidos', OLD.Id_Pedido, 'DELETE',
        JSON_OBJECT('Id_Pedido', OLD.Id_Pedido, 'Factura', OLD.Factura)
    );
END$$

DELIMITER ;

-- ========================================
-- 3. PROCEDIMIENTOS ÚTILES
-- ========================================

DELIMITER $$

-- Obtener registros pendientes de sincronizar
CREATE PROCEDURE sp_get_pending_sync(IN limite INT)
BEGIN
    SELECT
        id_sync,
        tabla,
        id_registro,
        operacion,
        fecha_cambio,
        datos_json
    FROM tbl_sync_queue
    WHERE sincronizado = 0
    ORDER BY fecha_cambio ASC
    LIMIT limite;
END$$

-- Marcar registro como sincronizado
CREATE PROCEDURE sp_mark_synced(IN p_id_sync INT)
BEGIN
    UPDATE tbl_sync_queue
    SET sincronizado = 1,
        fecha_sincronizacion = NOW()
    WHERE id_sync = p_id_sync;
END$$

-- Marcar error en sincronización
CREATE PROCEDURE sp_mark_sync_error(
    IN p_id_sync INT,
    IN p_error TEXT
)
BEGIN
    UPDATE tbl_sync_queue
    SET intentos = intentos + 1,
        ultimo_error = p_error
    WHERE id_sync = p_id_sync;
END$$

-- Limpiar registros sincronizados antiguos (más de 30 días)
CREATE PROCEDURE sp_clean_old_synced()
BEGIN
    DELETE FROM tbl_sync_queue
    WHERE sincronizado = 1
    AND fecha_sincronizacion < DATE_SUB(NOW(), INTERVAL 30 DAY);
END$$

DELIMITER ;

-- ========================================
-- 4. VISTA PARA MONITOREO
-- ========================================

CREATE OR REPLACE VIEW v_sync_status AS
SELECT
    tabla,
    COUNT(*) as total_pendientes,
    MIN(fecha_cambio) as cambio_mas_antiguo,
    MAX(fecha_cambio) as cambio_mas_reciente,
    SUM(CASE WHEN intentos > 0 THEN 1 ELSE 0 END) as con_errores
FROM tbl_sync_queue
WHERE sincronizado = 0
GROUP BY tabla;
