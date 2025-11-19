-- Dar todos los permisos al usuario classroom_user
GRANT ALL PRIVILEGES ON *.* TO 'classroom_user'@'%' WITH GRANT OPTION;

-- Permitir crear y eliminar bases de datos (necesario para shadow database)
GRANT CREATE, DROP ON *.* TO 'classroom_user'@'%';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Mensaje de confirmación
SELECT 'Permisos otorgados correctamente a classroom_user' AS status;