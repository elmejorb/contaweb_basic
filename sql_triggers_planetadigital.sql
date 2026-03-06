-- ============================================================
-- SQL para agregar sistema de sincronización a conta_planetadigital
-- Incluye: tabla tbl_cambios_sincronizar + 15 triggers
-- Generado comparando con conta_amiiaccesorios
-- ============================================================

USE conta_planetadigital;

-- ============================================================
-- 1. CREAR TABLA tbl_cambios_sincronizar (no existe)
-- ============================================================
CREATE TABLE IF NOT EXISTS `tbl_cambios_sincronizar` (
  `id_cambio` int(11) NOT NULL AUTO_INCREMENT,
  `tabla_nombre` varchar(50) NOT NULL,
  `registro_id` varchar(100) NOT NULL,
  `operacion` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `datos_json` text DEFAULT NULL,
  `sincronizado` tinyint(4) DEFAULT 0,
  `intentos_sincronizacion` int(11) DEFAULT 0,
  `ultimo_error` text DEFAULT NULL,
  `fecha_cambio` datetime DEFAULT current_timestamp(),
  `fecha_sincronizado` datetime DEFAULT NULL,
  PRIMARY KEY (`id_cambio`),
  KEY `idx_sincronizado` (`sincronizado`),
  KEY `idx_tabla` (`tabla_nombre`),
  KEY `idx_fecha` (`fecha_cambio`),
  KEY `idx_tabla_registro` (`tabla_nombre`,`registro_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 1.5 AGREGAR CAMPO Precio_Venta4 a tblarticulos (si no existe)
-- ============================================================
SET @existe_pv4 = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tblarticulos'
    AND COLUMN_NAME = 'Precio_Venta4');

SET @sql_pv4 = IF(@existe_pv4 = 0,
    'ALTER TABLE tblarticulos ADD COLUMN Precio_Venta4 DECIMAL(19,4) DEFAULT NULL AFTER Precio_Venta3',
    'SELECT 1');
PREPARE stmt FROM @sql_pv4;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- 2. TRIGGERS PARA tblarticulos (INSERT, UPDATE, DELETE)
-- ============================================================

DELIMITER ;;

DROP TRIGGER IF EXISTS trg_articulos_after_insert;;
CREATE TRIGGER trg_articulos_after_insert
AFTER INSERT ON tblarticulos
FOR EACH ROW
BEGIN
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblarticulos',
        NEW.Items,
        'INSERT',
        JSON_OBJECT(
            'Items', NEW.Items,
            'Codigo', NEW.Codigo,
            'Nombres_Articulo', NEW.Nombres_Articulo,
            'Id_Categoria', NEW.Id_Categoria,
            'Precio_Venta', NEW.Precio_Venta,
            'Precio_Venta2', IFNULL(NEW.Precio_Venta2, NEW.Precio_Venta),
            'Precio_Venta3', IFNULL(NEW.Precio_Venta3, NEW.Precio_Venta),
            'Precio_Venta4', IFNULL(NEW.Precio_Venta4, NEW.Precio_Venta),
            'Precio_Costo', NEW.Precio_Costo,
            'Precio_Minimo', IFNULL(NEW.Precio_Minimo, NEW.Precio_Costo),
            'Existencia', NEW.Existencia,
            'Existencia_minima', IFNULL(NEW.Existencia_minima, 0),
            'Servicio', IFNULL(NEW.Servicio, 0),
            'CodigoPro', IFNULL(NEW.CodigoPro, 0),
            'Iva', NEW.Iva,
            'Estado', NEW.Estado
        )
    );
END;;

DROP TRIGGER IF EXISTS trg_articulos_after_update;;
CREATE TRIGGER trg_articulos_after_update
AFTER UPDATE ON tblarticulos
FOR EACH ROW
BEGIN
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblarticulos',
        NEW.Items,
        'UPDATE',
        JSON_OBJECT(
            'Items', NEW.Items,
            'Codigo', NEW.Codigo,
            'Nombres_Articulo', NEW.Nombres_Articulo,
            'Id_Categoria', NEW.Id_Categoria,
            'Precio_Venta', NEW.Precio_Venta,
            'Precio_Venta2', IFNULL(NEW.Precio_Venta2, NEW.Precio_Venta),
            'Precio_Venta3', IFNULL(NEW.Precio_Venta3, NEW.Precio_Venta),
            'Precio_Venta4', IFNULL(NEW.Precio_Venta4, NEW.Precio_Venta),
            'Precio_Costo', NEW.Precio_Costo,
            'Precio_Minimo', IFNULL(NEW.Precio_Minimo, NEW.Precio_Costo),
            'Existencia', NEW.Existencia,
            'Existencia_minima', IFNULL(NEW.Existencia_minima, 0),
            'Servicio', IFNULL(NEW.Servicio, 0),
            'CodigoPro', IFNULL(NEW.CodigoPro, 0),
            'Iva', NEW.Iva,
            'Estado', NEW.Estado
        )
    );
END;;

DROP TRIGGER IF EXISTS trg_articulos_after_delete;;
CREATE TRIGGER trg_articulos_after_delete
AFTER DELETE ON tblarticulos
FOR EACH ROW
BEGIN
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblarticulos',
        OLD.Items,
        'DELETE',
        JSON_OBJECT(
            'Items', OLD.Items,
            'Codigo', OLD.Codigo
        )
    );
END;;

-- ============================================================
-- 3. TRIGGERS PARA tblcategoria (INSERT, UPDATE, DELETE)
-- ============================================================

DROP TRIGGER IF EXISTS trg_categoria_after_insert;;
CREATE TRIGGER trg_categoria_after_insert
AFTER INSERT ON tblcategoria
FOR EACH ROW
BEGIN
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblcategoria',
        NEW.Id_Categoria,
        'INSERT',
        JSON_OBJECT(
            'Id_Categoria', NEW.Id_Categoria,
            'Categoria', NEW.Categoria
        )
    );
END;;

DROP TRIGGER IF EXISTS trg_categoria_after_update;;
CREATE TRIGGER trg_categoria_after_update
AFTER UPDATE ON tblcategoria
FOR EACH ROW
BEGIN
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblcategoria',
        NEW.Id_Categoria,
        'UPDATE',
        JSON_OBJECT(
            'Id_Categoria', NEW.Id_Categoria,
            'Categoria', NEW.Categoria
        )
    );
END;;

DROP TRIGGER IF EXISTS trg_categoria_after_delete;;
CREATE TRIGGER trg_categoria_after_delete
AFTER DELETE ON tblcategoria
FOR EACH ROW
BEGIN
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblcategoria',
        OLD.Id_Categoria,
        'DELETE',
        JSON_OBJECT(
            'Id_Categoria', OLD.Id_Categoria,
            'Categoria', OLD.Categoria
        )
    );
END;;

-- ============================================================
-- 4. TRIGGERS PARA tblclientes (INSERT, UPDATE, DELETE)
-- ============================================================

DROP TRIGGER IF EXISTS trg_clientes_after_insert;;
CREATE TRIGGER trg_clientes_after_insert
AFTER INSERT ON tblclientes
FOR EACH ROW
BEGIN
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblclientes',
        NEW.CodigoClien,
        'INSERT',
        JSON_OBJECT(
            'CodigoClien', NEW.CodigoClien,
            'Razon_Social', IFNULL(NEW.Razon_Social, ''),
            'Nit', IFNULL(NEW.Nit, ''),
            'Direccion', IFNULL(NEW.Direccion, ''),
            'Telefonos', IFNULL(NEW.Telefonos, ''),
            'Email', IFNULL(NEW.Email, ''),
            'CupoAutorizado', IFNULL(NEW.CupoAutorizado, 0),
            'id_documento', IFNULL(NEW.id_documento, 0),
            'id_municipio', IFNULL(NEW.id_municipio, 0),
            'id_type_liability', IFNULL(NEW.id_type_liability, 0),
            'id_type_organization', IFNULL(NEW.id_type_organization, 0),
            'id_type_regime', IFNULL(NEW.id_type_regime, 0),
            'Whatsapp', IFNULL(NEW.Whatsapp, ''),
            'Nombre_C', IFNULL(NEW.Nombre_C, ''),
            'Apellidos_C', IFNULL(NEW.Apellidos_C, ''),
            'Telefonos_C', IFNULL(NEW.Telefonos_C, ''),
            'Direccion_C', IFNULL(NEW.Direccion_C, ''),
            'Fecha_Ingreso', IFNULL(NEW.Fecha_Ingreso, ''),
            'FechaCumple', IFNULL(NEW.FechaCumple, ''),
            'Termino', IFNULL(NEW.Termino, 0),
            'FacVenc', IFNULL(NEW.FacVenc, 0),
            'Preciocosto', IFNULL(NEW.Preciocosto, 0)
        )
    );
END;;

DROP TRIGGER IF EXISTS trg_clientes_after_update;;
CREATE TRIGGER trg_clientes_after_update
AFTER UPDATE ON tblclientes
FOR EACH ROW
BEGIN
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblclientes',
        NEW.CodigoClien,
        'UPDATE',
        JSON_OBJECT(
            'CodigoClien', NEW.CodigoClien,
            'Razon_Social', IFNULL(NEW.Razon_Social, ''),
            'Nit', IFNULL(NEW.Nit, ''),
            'Direccion', IFNULL(NEW.Direccion, ''),
            'Telefonos', IFNULL(NEW.Telefonos, ''),
            'Email', IFNULL(NEW.Email, ''),
            'CupoAutorizado', IFNULL(NEW.CupoAutorizado, 0),
            'id_documento', IFNULL(NEW.id_documento, 0),
            'id_municipio', IFNULL(NEW.id_municipio, 0),
            'id_type_liability', IFNULL(NEW.id_type_liability, 0),
            'id_type_organization', IFNULL(NEW.id_type_organization, 0),
            'id_type_regime', IFNULL(NEW.id_type_regime, 0),
            'Whatsapp', IFNULL(NEW.Whatsapp, ''),
            'Nombre_C', IFNULL(NEW.Nombre_C, ''),
            'Apellidos_C', IFNULL(NEW.Apellidos_C, ''),
            'Telefonos_C', IFNULL(NEW.Telefonos_C, ''),
            'Direccion_C', IFNULL(NEW.Direccion_C, ''),
            'Fecha_Ingreso', IFNULL(NEW.Fecha_Ingreso, ''),
            'FechaCumple', IFNULL(NEW.FechaCumple, ''),
            'Termino', IFNULL(NEW.Termino, 0),
            'FacVenc', IFNULL(NEW.FacVenc, 0),
            'Preciocosto', IFNULL(NEW.Preciocosto, 0)
        )
    );
END;;

DROP TRIGGER IF EXISTS trg_clientes_after_delete;;
CREATE TRIGGER trg_clientes_after_delete
AFTER DELETE ON tblclientes
FOR EACH ROW
BEGIN
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblclientes',
        OLD.CodigoClien,
        'DELETE',
        JSON_OBJECT(
            'CodigoClien', OLD.CodigoClien,
            'Razon_Social', IFNULL(OLD.Razon_Social, ''),
            'Nit', IFNULL(OLD.Nit, '')
        )
    );
END;;

-- ============================================================
-- 5. TRIGGERS PARA tblcontrolcaja (INSERT, UPDATE, DELETE)
-- ============================================================

DROP TRIGGER IF EXISTS trg_controlcaja_after_insert;;
CREATE TRIGGER trg_controlcaja_after_insert
AFTER INSERT ON tblcontrolcaja
FOR EACH ROW
BEGIN
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblcontrolcaja',
        NEW.Cod_ControlCaja,
        'INSERT',
        JSON_OBJECT(
            'Cod_ControlCaja', NEW.Cod_ControlCaja,
            'Fecha', NEW.Fecha,
            'ValorInicalCaja', NEW.ValorInicalCaja,
            'Villetes', NEW.Villetes,
            'Monedas', NEW.Monedas,
            'Cheques', NEW.Cheques,
            'ValorTotal', NEW.ValorTotal,
            'SaldoEnLibros', NEW.SaldoEnLibros,
            'Diferencia', NEW.Diferencia,
            'Base', NEW.Base,
            'Estado', NEW.Estado,
            'VContado', NEW.VContado,
            'VCredito', NEW.VCredito,
            'Pagos', NEW.Pagos,
            'Egresos', NEW.Egresos,
            'VInventario', NEW.VInventario,
            'Id_Usuario', NEW.Id_Usuario,
            'FechaCierre', NEW.FechaCierre
        )
    );
END;;

DROP TRIGGER IF EXISTS trg_controlcaja_after_update;;
CREATE TRIGGER trg_controlcaja_after_update
AFTER UPDATE ON tblcontrolcaja
FOR EACH ROW
BEGIN
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblcontrolcaja',
        NEW.Cod_ControlCaja,
        'UPDATE',
        JSON_OBJECT(
            'Cod_ControlCaja', NEW.Cod_ControlCaja,
            'Fecha', NEW.Fecha,
            'ValorInicalCaja', NEW.ValorInicalCaja,
            'Villetes', NEW.Villetes,
            'Monedas', NEW.Monedas,
            'Cheques', NEW.Cheques,
            'ValorTotal', NEW.ValorTotal,
            'SaldoEnLibros', NEW.SaldoEnLibros,
            'Diferencia', NEW.Diferencia,
            'Base', NEW.Base,
            'Estado', NEW.Estado,
            'VContado', NEW.VContado,
            'VCredito', NEW.VCredito,
            'Pagos', NEW.Pagos,
            'Egresos', NEW.Egresos,
            'VInventario', NEW.VInventario,
            'Id_Usuario', NEW.Id_Usuario,
            'FechaCierre', NEW.FechaCierre
        )
    );
END;;

DROP TRIGGER IF EXISTS trg_controlcaja_after_delete;;
CREATE TRIGGER trg_controlcaja_after_delete
AFTER DELETE ON tblcontrolcaja
FOR EACH ROW
BEGIN
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblcontrolcaja',
        OLD.Cod_ControlCaja,
        'DELETE',
        JSON_OBJECT(
            'Cod_ControlCaja', OLD.Cod_ControlCaja,
            'Fecha', OLD.Fecha
        )
    );
END;;

-- ============================================================
-- 6. TRIGGERS PARA tblpagos (INSERT, UPDATE, DELETE)
--    Estos triggers también actualizan saldo_cliente usando
--    la vista vw_saldos_por_cliente (ya existe en planetadigital)
-- ============================================================

DROP TRIGGER IF EXISTS trg_pagos_after_insert;;
CREATE TRIGGER trg_pagos_after_insert
AFTER INSERT ON tblpagos
FOR EACH ROW
BEGIN
    DECLARE v_saldo_total DECIMAL(18,2) DEFAULT 0;
    DECLARE v_nombre_cliente VARCHAR(100) DEFAULT '';

    -- Registrar el cambio del pago
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblpagos',
        NEW.Id_Pagos,
        'INSERT',
        JSON_OBJECT(
            'Id_Pagos', NEW.Id_Pagos,
            'RecCajaN', NEW.RecCajaN,
            'Codigo', NEW.Codigo,
            'Fact_N', NEW.Fact_N,
            'ValorPago', NEW.ValorPago,
            'Fecha', NEW.Fecha,
            'DetallePago', NEW.DetallePago,
            'ValorFact', NEW.ValorFact,
            'SaldoAct', NEW.SaldoAct,
            'Descuento', NEW.Descuento,
            'Retencion', NEW.Retencion,
            'IVARetenido', NEW.IVARetenido,
            'Estado', NEW.Estado,
            'Afectada', NEW.Afectada,
            'id_mediopago', NEW.id_mediopago,
            'Cuentas', NEW.Cuentas,
            'SaldoTotal', NEW.SaldoTotal,
            'NFactAnt', NEW.NFactAnt,
            'Nfact_electronica', NEW.Nfact_electronica,
            'Fact_Plan', NEW.Fact_Plan,
            'Cedula', NEW.Cedula,
            'RecibidoDe', NEW.RecibidoDe,
            'NRemision', NEW.NRemision
        )
    );

    -- Registrar actualización del saldo del cliente
    IF NEW.Codigo IS NOT NULL AND NEW.Codigo > 0 THEN
        SELECT IFNULL(SaldoTotal, 0), IFNULL(Cliente, '')
        INTO v_saldo_total, v_nombre_cliente
        FROM vw_saldos_por_cliente
        WHERE CodigoCli = NEW.Codigo
        LIMIT 1;

        INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
        VALUES (
            'saldo_cliente',
            NEW.Codigo,
            'UPDATE',
            JSON_OBJECT(
                'CodigoCli', NEW.Codigo,
                'Cliente', v_nombre_cliente,
                'SaldoTotal', v_saldo_total,
                'Origen', 'pago_insert',
                'Id_Pago', NEW.Id_Pagos
            )
        );
    END IF;
END;;

DROP TRIGGER IF EXISTS trg_pagos_after_update;;
CREATE TRIGGER trg_pagos_after_update
AFTER UPDATE ON tblpagos
FOR EACH ROW
BEGIN
    DECLARE v_saldo_total DECIMAL(18,2) DEFAULT 0;
    DECLARE v_nombre_cliente VARCHAR(100) DEFAULT '';

    -- Registrar el cambio del pago
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblpagos',
        NEW.Id_Pagos,
        'UPDATE',
        JSON_OBJECT(
            'Id_Pagos', NEW.Id_Pagos,
            'RecCajaN', NEW.RecCajaN,
            'Codigo', NEW.Codigo,
            'Fact_N', NEW.Fact_N,
            'ValorPago', NEW.ValorPago,
            'Fecha', NEW.Fecha,
            'DetallePago', NEW.DetallePago,
            'ValorFact', NEW.ValorFact,
            'SaldoAct', NEW.SaldoAct,
            'Descuento', NEW.Descuento,
            'Retencion', NEW.Retencion,
            'IVARetenido', NEW.IVARetenido,
            'Estado', NEW.Estado,
            'Afectada', NEW.Afectada,
            'id_mediopago', NEW.id_mediopago,
            'Cuentas', NEW.Cuentas,
            'SaldoTotal', NEW.SaldoTotal,
            'NFactAnt', NEW.NFactAnt,
            'Nfact_electronica', NEW.Nfact_electronica,
            'Fact_Plan', NEW.Fact_Plan,
            'Cedula', NEW.Cedula,
            'RecibidoDe', NEW.RecibidoDe,
            'NRemision', NEW.NRemision,
            'FechaMod', NEW.FechaMod
        )
    );

    -- Registrar actualización del saldo del cliente
    IF NEW.Codigo IS NOT NULL AND NEW.Codigo > 0 THEN
        SELECT IFNULL(SaldoTotal, 0), IFNULL(Cliente, '')
        INTO v_saldo_total, v_nombre_cliente
        FROM vw_saldos_por_cliente
        WHERE CodigoCli = NEW.Codigo
        LIMIT 1;

        INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
        VALUES (
            'saldo_cliente',
            NEW.Codigo,
            'UPDATE',
            JSON_OBJECT(
                'CodigoCli', NEW.Codigo,
                'Cliente', v_nombre_cliente,
                'SaldoTotal', v_saldo_total,
                'Origen', 'pago_update',
                'Id_Pago', NEW.Id_Pagos
            )
        );
    END IF;
END;;

DROP TRIGGER IF EXISTS trg_pagos_after_delete;;
CREATE TRIGGER trg_pagos_after_delete
AFTER DELETE ON tblpagos
FOR EACH ROW
BEGIN
    DECLARE v_saldo_total DECIMAL(18,2) DEFAULT 0;
    DECLARE v_nombre_cliente VARCHAR(100) DEFAULT '';

    -- Registrar eliminación del pago
    INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
    VALUES (
        'tblpagos',
        OLD.Id_Pagos,
        'DELETE',
        JSON_OBJECT(
            'Id_Pagos', OLD.Id_Pagos,
            'Fecha', OLD.Fecha,
            'Codigo', OLD.Codigo,
            'Fact_N', OLD.Fact_N,
            'ValorPago', OLD.ValorPago
        )
    );

    -- Registrar actualización del saldo del cliente
    IF OLD.Codigo IS NOT NULL AND OLD.Codigo > 0 THEN
        SELECT IFNULL(SaldoTotal, 0), IFNULL(Cliente, '')
        INTO v_saldo_total, v_nombre_cliente
        FROM vw_saldos_por_cliente
        WHERE CodigoCli = OLD.Codigo
        LIMIT 1;

        INSERT INTO tbl_cambios_sincronizar (tabla_nombre, registro_id, operacion, datos_json)
        VALUES (
            'saldo_cliente',
            OLD.Codigo,
            'UPDATE',
            JSON_OBJECT(
                'CodigoCli', OLD.Codigo,
                'Cliente', v_nombre_cliente,
                'SaldoTotal', v_saldo_total,
                'Origen', 'pago_delete',
                'Id_Pago', OLD.Id_Pagos
            )
        );
    END IF;
END;;

DELIMITER ;

-- ============================================================
-- RESUMEN:
-- - 1 tabla creada: tbl_cambios_sincronizar
-- - 15 triggers creados:
--   * tblarticulos:   INSERT, UPDATE, DELETE (3)
--   * tblcategoria:   INSERT, UPDATE, DELETE (3)
--   * tblclientes:    INSERT, UPDATE, DELETE (3)
--   * tblcontrolcaja: INSERT, UPDATE, DELETE (3)
--   * tblpagos:       INSERT, UPDATE, DELETE (3)
-- - Prerequisito: vista vw_saldos_por_cliente (ya existe)
-- ============================================================
