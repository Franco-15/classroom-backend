-- PostgreSQL initialization script
-- Este script se ejecuta automáticamente al iniciar el contenedor

-- Crear extensiones útiles (opcional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- El usuario y la base de datos ya son creados por las variables de entorno
-- Mensaje de confirmación
SELECT 'Base de datos PostgreSQL inicializada correctamente' AS status;