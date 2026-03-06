-- Agregar campos a tabla empresas
ALTER TABLE empresas
ADD COLUMN codigo_empresa VARCHAR(20) NULL AFTER id_empresa,
ADD COLUMN token_api VARCHAR(64) NULL AFTER codigo_empresa;

-- Agregar índices únicos
CREATE UNIQUE INDEX empresas_codigo_empresa_unique ON empresas(codigo_empresa);
CREATE UNIQUE INDEX empresas_token_api_unique ON empresas(token_api);
CREATE INDEX empresas_codigo_empresa_index ON empresas(codigo_empresa);
CREATE INDEX empresas_token_api_index ON empresas(token_api);

-- Generar códigos y tokens para empresas existentes
UPDATE empresas
SET
  codigo_empresa = CONCAT('EMP', LPAD(id_empresa, 4, '0')),
  token_api = MD5(CONCAT(RAND(), NOW(), id_empresa));
