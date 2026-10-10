-- =====================================================================
-- Conta Web — Schema v2 (reset limpio)
-- =====================================================================
-- Objetivo: tablas con nombres consistentes, FKs reales, timestamps y
-- un pipeline de sincronización SIN pérdida (idempotency_key por fila).
--
-- Diseño:
--   * snake_case en todo (columnas y tablas).
--   * PK siempre `id` BIGINT UNSIGNED AUTO_INCREMENT.
--   * `empresa_id` FK a `empresas(id)` → scoping por empresa.
--   * `codigo_externo` = ID original del desktop VB6 (ex-codvb6, CodigoClien,
--      Factura_N, etc.). UNIQUE por (empresa_id, origen, codigo_externo).
--   * `origen` = 'desktop_vb6' | 'manual' | 'api' — para auditar de dónde viene cada fila.
--   * `fecha_actualizacion_origen` = timestamp del lado emisor (resuelve conflictos).
--   * Soft delete con `deleted_at` solo donde tiene sentido (clientes/productos/proveedores).
--   * Decimales: dinero DECIMAL(15,2), costos internos DECIMAL(15,4), porcentajes DECIMAL(5,2).
--
-- Las tablas CORE (empresas, usuarios, usuarios_empresas, tipos_usuario,
-- sesiones_usuario) se MANTIENEN como están — el login ya funciona.
--
-- Idempotente: se puede re-ejecutar. Hace DROP de todo lo transaccional.
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------
-- 0) Limpieza de tablas v1 que vamos a reemplazar
-- -----------------------------------------------------------------
DROP TABLE IF EXISTS sync_items;
DROP TABLE IF EXISTS sync_batches;
DROP TABLE IF EXISTS movimientos_inventario;
DROP TABLE IF EXISTS gastos;
DROP TABLE IF EXISTS pagos_proveedor;
DROP TABLE IF EXISTS compra_items;
DROP TABLE IF EXISTS compras;
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS venta_items;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS cierres_caja;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS impuestos;
DROP TABLE IF EXISTS unidades_medida;
DROP TABLE IF EXISTS tipos_documento;
DROP TABLE IF EXISTS formas_pago;
DROP TABLE IF EXISTS bodegas;
DROP TABLE IF EXISTS vendedores;

-- -----------------------------------------------------------------
-- 1) Catálogos globales (no son por empresa)
-- -----------------------------------------------------------------

-- Tipos de documento DIAN (CC, NIT, PP, CE, TI, NUIP, DIE, PA)
CREATE TABLE tipos_documento (
  id            TINYINT UNSIGNED PRIMARY KEY,
  codigo        VARCHAR(10) NOT NULL UNIQUE,     -- CC, NIT, PP…
  nombre        VARCHAR(50) NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tipos_documento (id, codigo, nombre) VALUES
  (1, 'CC',   'Cédula de Ciudadanía'),
  (2, 'NIT',  'NIT'),
  (3, 'CE',   'Cédula de Extranjería'),
  (4, 'TI',   'Tarjeta de Identidad'),
  (5, 'PP',   'Pasaporte'),
  (6, 'PA',   'Pasaporte Extranjero'),
  (7, 'DIE',  'Documento de Identificación Extranjero'),
  (8, 'NUIP', 'NUIP'),
  (9, 'RC',   'Registro Civil');

-- Unidades de medida DIAN
CREATE TABLE unidades_medida (
  id            SMALLINT UNSIGNED PRIMARY KEY,
  codigo        VARCHAR(10) NOT NULL UNIQUE,     -- UND, KG, LT…
  nombre        VARCHAR(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO unidades_medida (id, codigo, nombre) VALUES
  (70, 'UND', 'Unidad'),
  (71, 'KG',  'Kilogramo'),
  (72, 'GR',  'Gramo'),
  (73, 'LT',  'Litro'),
  (74, 'ML',  'Mililitro'),
  (75, 'MT',  'Metro'),
  (76, 'CM',  'Centímetro'),
  (77, 'CJ',  'Caja'),
  (78, 'PQ',  'Paquete'),
  (79, 'DOC', 'Docena');

-- Impuestos (IVA 0%, 5%, 19%, INC 8%…)
CREATE TABLE impuestos (
  id            TINYINT UNSIGNED PRIMARY KEY,
  codigo        VARCHAR(10) NOT NULL UNIQUE,     -- IVA19, IVA5, IVA0, INC8…
  nombre        VARCHAR(60) NOT NULL,
  porcentaje    DECIMAL(5,2) NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO impuestos (id, codigo, nombre, porcentaje) VALUES
  (1, 'IVA0',  'IVA Exento 0%',   0.00),
  (2, 'IVA5',  'IVA 5%',          5.00),
  (3, 'IVA19', 'IVA 19%',        19.00),
  (4, 'INC8',  'INC 8%',          8.00);

-- Formas de pago
CREATE TABLE formas_pago (
  id            TINYINT UNSIGNED PRIMARY KEY,
  codigo        VARCHAR(20) NOT NULL UNIQUE,
  nombre        VARCHAR(60) NOT NULL,
  afecta_caja   BOOLEAN NOT NULL DEFAULT TRUE,   -- false = crédito/no efectivo
  activa        BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO formas_pago (id, codigo, nombre, afecta_caja) VALUES
  (1, 'efectivo',      'Efectivo',       TRUE),
  (2, 'transferencia', 'Transferencia',  TRUE),
  (3, 'tarjeta',       'Tarjeta',        TRUE),
  (4, 'nequi',         'Nequi',          TRUE),
  (5, 'daviplata',     'Daviplata',      TRUE),
  (6, 'credito',       'Crédito',        FALSE),
  (7, 'otro',          'Otro',           TRUE);

-- -----------------------------------------------------------------
-- 2) Catálogos por empresa
-- -----------------------------------------------------------------

CREATE TABLE categorias (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id    BIGINT UNSIGNED NOT NULL,
  codigo_externo VARCHAR(50) NOT NULL,            -- ID original del desktop
  nombre        VARCHAR(100) NOT NULL,
  activa        BOOLEAN NOT NULL DEFAULT TRUE,
  origen        VARCHAR(20) NOT NULL DEFAULT 'desktop_vb6',
  created_at    TIMESTAMP NULL,
  updated_at    TIMESTAMP NULL,
  UNIQUE KEY uk_cat_empresa_externo (empresa_id, origen, codigo_externo),
  INDEX idx_cat_empresa (empresa_id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bodegas (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id    BIGINT UNSIGNED NOT NULL,
  codigo_externo VARCHAR(50) NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  es_principal  BOOLEAN NOT NULL DEFAULT FALSE,
  activa        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NULL,
  updated_at    TIMESTAMP NULL,
  UNIQUE KEY uk_bod_empresa_externo (empresa_id, codigo_externo),
  INDEX idx_bod_empresa (empresa_id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vendedores (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id    BIGINT UNSIGNED NOT NULL,
  codigo_externo VARCHAR(50) NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NULL,
  telefono      VARCHAR(30) NULL,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NULL,
  updated_at    TIMESTAMP NULL,
  UNIQUE KEY uk_vend_empresa_externo (empresa_id, codigo_externo),
  INDEX idx_vend_empresa (empresa_id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------
-- 3) Transaccionales — Personas
-- -----------------------------------------------------------------

CREATE TABLE clientes (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id        BIGINT UNSIGNED NOT NULL,
  codigo_externo    VARCHAR(50) NOT NULL,          -- CodigoClien del desktop
  razon_social      VARCHAR(200) NOT NULL,
  tipo_documento_id TINYINT UNSIGNED NULL,
  numero_documento  VARCHAR(30) NULL,
  dv                VARCHAR(2) NULL,
  nombres           VARCHAR(100) NULL,
  apellidos         VARCHAR(100) NULL,
  email             VARCHAR(150) NULL,
  telefono          VARCHAR(30) NULL,
  celular           VARCHAR(30) NULL,
  whatsapp          VARCHAR(30) NULL,
  direccion         VARCHAR(200) NULL,
  ciudad            VARCHAR(80) NULL,
  cupo_credito      DECIMAL(15,2) NOT NULL DEFAULT 0,
  dias_credito      INT NOT NULL DEFAULT 0,
  fecha_nacimiento  DATE NULL,
  vendedor_id       BIGINT UNSIGNED NULL,
  factura_a_precio_costo BOOLEAN NOT NULL DEFAULT FALSE,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  origen            VARCHAR(20) NOT NULL DEFAULT 'desktop_vb6',
  fecha_actualizacion_origen DATETIME NULL,
  created_at        TIMESTAMP NULL,
  updated_at        TIMESTAMP NULL,
  deleted_at        TIMESTAMP NULL,
  UNIQUE KEY uk_cli_empresa_externo (empresa_id, origen, codigo_externo),
  INDEX idx_cli_empresa (empresa_id),
  INDEX idx_cli_razon_social (razon_social),
  INDEX idx_cli_documento (numero_documento),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id),
  FOREIGN KEY (vendedor_id) REFERENCES vendedores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE proveedores (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id        BIGINT UNSIGNED NOT NULL,
  codigo_externo    VARCHAR(50) NOT NULL,
  razon_social      VARCHAR(200) NOT NULL,
  tipo_documento_id TINYINT UNSIGNED NULL,
  numero_documento  VARCHAR(30) NULL,
  dv                VARCHAR(2) NULL,
  email             VARCHAR(150) NULL,
  telefono          VARCHAR(30) NULL,
  direccion         VARCHAR(200) NULL,
  ciudad            VARCHAR(80) NULL,
  cuenta_bancaria   VARCHAR(50) NULL,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  origen            VARCHAR(20) NOT NULL DEFAULT 'desktop_vb6',
  fecha_actualizacion_origen DATETIME NULL,
  created_at        TIMESTAMP NULL,
  updated_at        TIMESTAMP NULL,
  deleted_at        TIMESTAMP NULL,
  UNIQUE KEY uk_prov_empresa_externo (empresa_id, origen, codigo_externo),
  INDEX idx_prov_empresa (empresa_id),
  INDEX idx_prov_razon_social (razon_social),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------
-- 4) Transaccionales — Productos
-- -----------------------------------------------------------------

CREATE TABLE productos (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id        BIGINT UNSIGNED NOT NULL,
  codigo_externo    VARCHAR(50) NOT NULL,          -- Items del desktop
  codigo            VARCHAR(50) NULL,              -- Codigo visible (SKU)
  codigo_barras     VARCHAR(60) NULL,
  nombre            VARCHAR(200) NOT NULL,
  descripcion       TEXT NULL,
  categoria_id      BIGINT UNSIGNED NULL,
  impuesto_id       TINYINT UNSIGNED NULL,
  unidad_medida_id  SMALLINT UNSIGNED NOT NULL DEFAULT 70,
  precio_costo      DECIMAL(15,4) NOT NULL DEFAULT 0,    -- incluye IVA (regla del negocio actual)
  precio_venta      DECIMAL(15,2) NOT NULL DEFAULT 0,
  precio_venta_2    DECIMAL(15,2) NOT NULL DEFAULT 0,
  precio_venta_3    DECIMAL(15,2) NOT NULL DEFAULT 0,
  precio_minimo     DECIMAL(15,2) NOT NULL DEFAULT 0,
  existencia        DECIMAL(15,2) NOT NULL DEFAULT 0,
  existencia_minima DECIMAL(15,2) NOT NULL DEFAULT 0,
  es_servicio       BOOLEAN NOT NULL DEFAULT FALSE,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  origen            VARCHAR(20) NOT NULL DEFAULT 'desktop_vb6',
  fecha_actualizacion_origen DATETIME NULL,
  created_at        TIMESTAMP NULL,
  updated_at        TIMESTAMP NULL,
  deleted_at        TIMESTAMP NULL,
  UNIQUE KEY uk_prod_empresa_externo (empresa_id, origen, codigo_externo),
  INDEX idx_prod_empresa (empresa_id),
  INDEX idx_prod_nombre (nombre),
  INDEX idx_prod_codigo (codigo),
  INDEX idx_prod_barras (codigo_barras),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  FOREIGN KEY (impuesto_id) REFERENCES impuestos(id),
  FOREIGN KEY (unidad_medida_id) REFERENCES unidades_medida(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------
-- 5) Transaccionales — Ventas
-- -----------------------------------------------------------------

CREATE TABLE ventas (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id        BIGINT UNSIGNED NOT NULL,
  codigo_externo    VARCHAR(50) NOT NULL,          -- Factura_N del desktop
  numero_factura    VARCHAR(50) NOT NULL,
  prefijo           VARCHAR(10) NULL,              -- POS, FE, NC…
  cliente_id        BIGINT UNSIGNED NOT NULL,
  vendedor_id       BIGINT UNSIGNED NULL,
  forma_pago_id     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  fecha             DATETIME NOT NULL,
  dias_credito      INT NOT NULL DEFAULT 0,
  subtotal          DECIMAL(15,2) NOT NULL DEFAULT 0,  -- antes de impuestos y descuentos
  descuento         DECIMAL(15,2) NOT NULL DEFAULT 0,
  impuesto          DECIMAL(15,2) NOT NULL DEFAULT 0,
  total             DECIMAL(15,2) NOT NULL DEFAULT 0,
  abono             DECIMAL(15,2) NOT NULL DEFAULT 0,  -- pagado al momento
  saldo             DECIMAL(15,2) NOT NULL DEFAULT 0,  -- deuda pendiente
  utilidad          DECIMAL(15,2) NOT NULL DEFAULT 0,  -- Σ (venta - costo) × cantidad
  costo_total       DECIMAL(15,2) NOT NULL DEFAULT 0,  -- Σ costo × cantidad
  estado            ENUM('activa', 'anulada', 'devuelta') NOT NULL DEFAULT 'activa',
  es_electronica    BOOLEAN NOT NULL DEFAULT FALSE,
  cufe              VARCHAR(100) NULL,
  observaciones     TEXT NULL,
  origen            VARCHAR(20) NOT NULL DEFAULT 'desktop_vb6',
  fecha_actualizacion_origen DATETIME NULL,
  created_at        TIMESTAMP NULL,
  updated_at        TIMESTAMP NULL,
  UNIQUE KEY uk_vta_empresa_externo (empresa_id, origen, codigo_externo),
  INDEX idx_vta_empresa_fecha (empresa_id, fecha),
  INDEX idx_vta_cliente (cliente_id),
  INDEX idx_vta_estado (empresa_id, estado),
  INDEX idx_vta_saldo (empresa_id, saldo),           -- para cartera
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (vendedor_id) REFERENCES vendedores(id) ON DELETE SET NULL,
  FOREIGN KEY (forma_pago_id) REFERENCES formas_pago(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE venta_items (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venta_id          BIGINT UNSIGNED NOT NULL,
  producto_id       BIGINT UNSIGNED NULL,          -- null si es texto libre (servicio ocasional)
  descripcion       VARCHAR(300) NOT NULL,          -- snapshot al momento
  cantidad          DECIMAL(15,2) NOT NULL,
  precio_costo      DECIMAL(15,4) NOT NULL DEFAULT 0,
  precio_venta      DECIMAL(15,2) NOT NULL,
  descuento         DECIMAL(15,2) NOT NULL DEFAULT 0,
  porcentaje_iva    DECIMAL(5,2) NOT NULL DEFAULT 0,
  impuesto          DECIMAL(15,2) NOT NULL DEFAULT 0,
  subtotal          DECIMAL(15,2) NOT NULL,         -- (cantidad × precio_venta) - descuento
  total             DECIMAL(15,2) NOT NULL,         -- subtotal + impuesto
  utilidad          DECIMAL(15,2) NOT NULL DEFAULT 0,
  entregado         BOOLEAN NOT NULL DEFAULT TRUE,  -- modo fabricación
  INDEX idx_vi_venta (venta_id),
  INDEX idx_vi_producto (producto_id),
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------
-- 6) Transaccionales — Pagos de clientes (abonos a ventas crédito)
-- -----------------------------------------------------------------

CREATE TABLE pagos (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id        BIGINT UNSIGNED NOT NULL,
  codigo_externo    VARCHAR(50) NOT NULL,          -- Id_Pagos del desktop
  cliente_id        BIGINT UNSIGNED NOT NULL,
  venta_id          BIGINT UNSIGNED NULL,          -- null si es abono general
  forma_pago_id     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  fecha             DATETIME NOT NULL,
  valor             DECIMAL(15,2) NOT NULL,
  descuento         DECIMAL(15,2) NOT NULL DEFAULT 0,
  retencion         DECIMAL(15,2) NOT NULL DEFAULT 0,
  observaciones     VARCHAR(300) NULL,
  estado            ENUM('activo', 'anulado') NOT NULL DEFAULT 'activo',
  origen            VARCHAR(20) NOT NULL DEFAULT 'desktop_vb6',
  fecha_actualizacion_origen DATETIME NULL,
  created_at        TIMESTAMP NULL,
  updated_at        TIMESTAMP NULL,
  UNIQUE KEY uk_pag_empresa_externo (empresa_id, origen, codigo_externo),
  INDEX idx_pag_empresa_fecha (empresa_id, fecha),
  INDEX idx_pag_cliente (cliente_id),
  INDEX idx_pag_venta (venta_id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL,
  FOREIGN KEY (forma_pago_id) REFERENCES formas_pago(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------
-- 7) Transaccionales — Compras (nuevo soporte)
-- -----------------------------------------------------------------

CREATE TABLE compras (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id        BIGINT UNSIGNED NOT NULL,
  codigo_externo    VARCHAR(50) NOT NULL,          -- Pedido_N del desktop
  numero_factura    VARCHAR(50) NOT NULL,
  proveedor_id      BIGINT UNSIGNED NOT NULL,
  forma_pago_id     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  fecha             DATETIME NOT NULL,
  dias_credito      INT NOT NULL DEFAULT 0,
  subtotal          DECIMAL(15,2) NOT NULL DEFAULT 0,
  descuento         DECIMAL(15,2) NOT NULL DEFAULT 0,
  impuesto          DECIMAL(15,2) NOT NULL DEFAULT 0,
  flete             DECIMAL(15,2) NOT NULL DEFAULT 0,
  total             DECIMAL(15,2) NOT NULL DEFAULT 0,
  abono             DECIMAL(15,2) NOT NULL DEFAULT 0,
  saldo             DECIMAL(15,2) NOT NULL DEFAULT 0,
  estado            ENUM('activa', 'anulada') NOT NULL DEFAULT 'activa',
  observaciones     TEXT NULL,
  origen            VARCHAR(20) NOT NULL DEFAULT 'desktop_vb6',
  fecha_actualizacion_origen DATETIME NULL,
  created_at        TIMESTAMP NULL,
  updated_at        TIMESTAMP NULL,
  UNIQUE KEY uk_cpa_empresa_externo (empresa_id, origen, codigo_externo),
  INDEX idx_cpa_empresa_fecha (empresa_id, fecha),
  INDEX idx_cpa_proveedor (proveedor_id),
  INDEX idx_cpa_saldo (empresa_id, saldo),           -- para cuentas por pagar
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  FOREIGN KEY (forma_pago_id) REFERENCES formas_pago(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE compra_items (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  compra_id         BIGINT UNSIGNED NOT NULL,
  producto_id       BIGINT UNSIGNED NULL,
  descripcion       VARCHAR(300) NOT NULL,
  cantidad          DECIMAL(15,2) NOT NULL,
  precio_costo      DECIMAL(15,4) NOT NULL,
  descuento         DECIMAL(15,2) NOT NULL DEFAULT 0,
  porcentaje_iva    DECIMAL(5,2) NOT NULL DEFAULT 0,
  impuesto          DECIMAL(15,2) NOT NULL DEFAULT 0,
  subtotal          DECIMAL(15,2) NOT NULL,
  total             DECIMAL(15,2) NOT NULL,
  INDEX idx_ci_compra (compra_id),
  INDEX idx_ci_producto (producto_id),
  FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pagos_proveedor (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id        BIGINT UNSIGNED NOT NULL,
  codigo_externo    VARCHAR(50) NOT NULL,
  proveedor_id      BIGINT UNSIGNED NOT NULL,
  compra_id         BIGINT UNSIGNED NULL,
  forma_pago_id     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  fecha             DATETIME NOT NULL,
  valor             DECIMAL(15,2) NOT NULL,
  observaciones     VARCHAR(300) NULL,
  estado            ENUM('activo', 'anulado') NOT NULL DEFAULT 'activo',
  origen            VARCHAR(20) NOT NULL DEFAULT 'desktop_vb6',
  created_at        TIMESTAMP NULL,
  updated_at        TIMESTAMP NULL,
  UNIQUE KEY uk_pp_empresa_externo (empresa_id, origen, codigo_externo),
  INDEX idx_pp_empresa_fecha (empresa_id, fecha),
  INDEX idx_pp_proveedor (proveedor_id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE SET NULL,
  FOREIGN KEY (forma_pago_id) REFERENCES formas_pago(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------
-- 8) Transaccionales — Gastos (nuevo soporte)
-- -----------------------------------------------------------------

CREATE TABLE gastos (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id        BIGINT UNSIGNED NOT NULL,
  codigo_externo    VARCHAR(50) NOT NULL,          -- Id_Egresos del desktop
  categoria         VARCHAR(60) NULL,              -- 'arriendo', 'servicios', 'nomina'…
  concepto          VARCHAR(300) NOT NULL,
  fecha             DATETIME NOT NULL,
  valor             DECIMAL(15,2) NOT NULL,
  forma_pago_id     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  beneficiario      VARCHAR(200) NULL,
  observaciones     TEXT NULL,
  estado            ENUM('activo', 'anulado') NOT NULL DEFAULT 'activo',
  origen            VARCHAR(20) NOT NULL DEFAULT 'desktop_vb6',
  fecha_actualizacion_origen DATETIME NULL,
  created_at        TIMESTAMP NULL,
  updated_at        TIMESTAMP NULL,
  UNIQUE KEY uk_gto_empresa_externo (empresa_id, origen, codigo_externo),
  INDEX idx_gto_empresa_fecha (empresa_id, fecha),
  INDEX idx_gto_categoria (empresa_id, categoria),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  FOREIGN KEY (forma_pago_id) REFERENCES formas_pago(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------
-- 9) Cierres de caja (snapshots diarios)
-- -----------------------------------------------------------------

CREATE TABLE cierres_caja (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id        BIGINT UNSIGNED NOT NULL,
  codigo_externo    VARCHAR(50) NOT NULL,          -- Cod_ControlCaja
  fecha_apertura    DATETIME NOT NULL,
  fecha_cierre      DATETIME NULL,
  usuario           VARCHAR(100) NULL,
  base_inicial      DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_ingresos_efectivo    DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_ingresos_transferencia DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_egresos     DECIMAL(15,2) NOT NULL DEFAULT 0,
  ventas_contado    DECIMAL(15,2) NOT NULL DEFAULT 0,
  ventas_credito    DECIMAL(15,2) NOT NULL DEFAULT 0,
  esperado_cierre   DECIMAL(15,2) NOT NULL DEFAULT 0,
  real_cierre       DECIMAL(15,2) NOT NULL DEFAULT 0,
  diferencia        DECIMAL(15,2) NOT NULL DEFAULT 0,
  observaciones     TEXT NULL,
  origen            VARCHAR(20) NOT NULL DEFAULT 'desktop_vb6',
  created_at        TIMESTAMP NULL,
  updated_at        TIMESTAMP NULL,
  UNIQUE KEY uk_cj_empresa_externo (empresa_id, origen, codigo_externo),
  INDEX idx_cj_empresa_fecha (empresa_id, fecha_cierre),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------
-- 10) Movimientos de inventario (kardex opcional)
-- -----------------------------------------------------------------

CREATE TABLE movimientos_inventario (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id        BIGINT UNSIGNED NOT NULL,
  producto_id       BIGINT UNSIGNED NOT NULL,
  fecha             DATETIME NOT NULL,
  tipo              ENUM('entrada','salida','ajuste','devolucion') NOT NULL,
  cantidad          DECIMAL(15,2) NOT NULL,
  precio_unitario   DECIMAL(15,4) NOT NULL DEFAULT 0,
  existencia_despues DECIMAL(15,2) NOT NULL,
  referencia_tipo   VARCHAR(30) NULL,              -- 'venta' | 'compra' | 'ajuste'
  referencia_id     BIGINT UNSIGNED NULL,
  observaciones     VARCHAR(200) NULL,
  created_at        TIMESTAMP NULL,
  INDEX idx_mi_producto_fecha (producto_id, fecha),
  INDEX idx_mi_empresa_fecha (empresa_id, fecha),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------
-- 11) Infraestructura de sync — SIN pérdida
-- -----------------------------------------------------------------

-- Cada POST /sync/* crea un batch
CREATE TABLE sync_batches (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id        BIGINT UNSIGNED NOT NULL,
  entidad           VARCHAR(30) NOT NULL,          -- clientes | productos | ventas…
  cantidad_items    INT NOT NULL,
  aceptados         INT NOT NULL DEFAULT 0,
  rechazados        INT NOT NULL DEFAULT 0,
  duplicados        INT NOT NULL DEFAULT 0,
  ip_origen         VARCHAR(45) NULL,
  recibido_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sb_empresa_fecha (empresa_id, recibido_at),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cada fila del batch deja un rastro con su idempotency_key.
-- Como idempotency_key es UNIQUE global, si llega 2 veces la segunda
-- se detecta como duplicate y NO se procesa dos veces. Esa es la garantía
-- de "sin pérdida": el worker reenvía hasta recibir ACK, el SaaS garantiza
-- que recibir la misma clave 2 veces no reinserta nada.
CREATE TABLE sync_items (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  batch_id          BIGINT UNSIGNED NOT NULL,
  empresa_id        BIGINT UNSIGNED NOT NULL,
  entidad           VARCHAR(30) NOT NULL,
  codigo_externo    VARCHAR(50) NOT NULL,
  idempotency_key   CHAR(64) NOT NULL,              -- SHA256 hex de (entidad+empresa+externo+fecha_actualizacion_origen)
  status            ENUM('ok','rejected','duplicate') NOT NULL,
  id_remoto         BIGINT UNSIGNED NULL,           -- PK del registro insertado/actualizado
  error_msg         VARCHAR(500) NULL,
  procesado_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_si_idempotency (idempotency_key),
  INDEX idx_si_batch (batch_id),
  INDEX idx_si_empresa_entidad (empresa_id, entidad),
  FOREIGN KEY (batch_id) REFERENCES sync_batches(id) ON DELETE CASCADE,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- Vistas útiles para el frontend móvil (lecturas rápidas sin lógica)
-- =====================================================================

CREATE OR REPLACE VIEW v_cartera_clientes AS
SELECT
  v.empresa_id,
  v.cliente_id,
  c.razon_social,
  c.telefono,
  c.celular,
  COUNT(v.id) AS num_facturas,
  SUM(v.saldo) AS saldo_total,
  MAX(v.fecha) AS ultima_factura
FROM ventas v
INNER JOIN clientes c ON c.id = v.cliente_id
WHERE v.estado = 'activa' AND v.saldo > 0
GROUP BY v.empresa_id, v.cliente_id, c.razon_social, c.telefono, c.celular;

CREATE OR REPLACE VIEW v_cuentas_por_pagar AS
SELECT
  c.empresa_id,
  c.proveedor_id,
  p.razon_social,
  p.telefono,
  COUNT(c.id) AS num_facturas,
  SUM(c.saldo) AS saldo_total,
  MAX(c.fecha) AS ultima_factura
FROM compras c
INNER JOIN proveedores p ON p.id = c.proveedor_id
WHERE c.estado = 'activa' AND c.saldo > 0
GROUP BY c.empresa_id, c.proveedor_id, p.razon_social, p.telefono;

CREATE OR REPLACE VIEW v_utilidad_mensual AS
SELECT
  empresa_id,
  YEAR(fecha) AS anio,
  MONTH(fecha) AS mes,
  COUNT(*) AS num_ventas,
  SUM(total) AS total_ventas,
  SUM(costo_total) AS total_costos,
  SUM(utilidad) AS utilidad_total
FROM ventas
WHERE estado = 'activa'
GROUP BY empresa_id, YEAR(fecha), MONTH(fecha);

CREATE OR REPLACE VIEW v_top_productos_mes AS
SELECT
  v.empresa_id,
  YEAR(v.fecha) AS anio,
  MONTH(v.fecha) AS mes,
  vi.producto_id,
  p.nombre,
  SUM(vi.cantidad) AS cantidad_vendida,
  SUM(vi.total) AS total_vendido,
  SUM(vi.utilidad) AS utilidad
FROM ventas v
INNER JOIN venta_items vi ON vi.venta_id = v.id
INNER JOIN productos p ON p.id = vi.producto_id
WHERE v.estado = 'activa'
GROUP BY v.empresa_id, YEAR(v.fecha), MONTH(v.fecha), vi.producto_id, p.nombre;
