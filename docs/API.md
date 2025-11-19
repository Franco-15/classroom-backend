# Documentación de la API — Google Classroom MVP (Backend)

Base URL: `http://{HOST}:{PORT}/api`

Autenticación: la mayoría de endpoints requieren el header:

Authorization: `Bearer <accessToken>`

Formato de respuesta (convención usada en la API):

- Éxito:

```
{
  "success": true,
  "data": { /* ... */ },
  "message": "Opcional"
}
```

- Error:

```
{
  "success": false,
  "error": "Descripción del error"
}
```

---

## 1. Autenticación

### POST /api/auth/register
- Descripción: Registrar nuevo usuario.
- Acceso: Público
- Body (JSON):
  - name (string, required, min 3)
  - email (string, required, email)
  - password (string, required, min 6)
  - role (optional: `ADMIN`, `TEACHER`, `STUDENT`)
- Respuesta: usuario creado y tokens (según implementación)

### POST /api/auth/login
- Descripción: Login con email/contraseña.
- Acceso: Público
- Body:
  - email (string, required)
  - password (string, required)
- Respuesta: accessToken, refreshToken, user

### POST /api/auth/refresh
- Descripción: Refrescar access token usando refresh token.
- Acceso: Público
- Body:
  - refreshToken (string, required)
- Respuesta: nuevo accessToken (y opcionalmente refreshToken)

### GET /api/auth/me
- Descripción: Obtener información del usuario autenticado.
- Acceso: Privado (Bearer token)
- Respuesta: información del usuario

### GET /api/auth/github
- Descripción: Inicia flujo OAuth con GitHub (redirección).
- Acceso: Público

### GET /api/auth/github/callback
- Descripción: Callback de GitHub; redirige a la app con tokens en la URL.
- Acceso: Público (usado por OAuth)

---

## 2. Clases

Base: `/api/classes`

### GET /api/classes/all
- Descripción: Obtener todas las clases (uso administrativo).
- Acceso: ADMIN

### GET /api/classes
- Descripción: Obtener las clases del usuario.
- Acceso: Autenticado

### GET /api/classes/:classId
- Descripción: Obtener detalles de una clase por ID.
- Acceso: Autenticado
- Params:
  - classId (UUID)

### POST /api/classes
- Descripción: Crear una nueva clase.
- Acceso: TEACHER, ADMIN
- Body:
  - name (string, required, min 3)
  - description (string, required)
  - subject (optional)

### PUT /api/classes/:classId
- Descripción: Actualizar una clase.
- Acceso: TEACHER, ADMIN
- Params: classId
- Body: campos opcionales (name, description, subject)

### DELETE /api/classes/:classId
- Descripción: Eliminar una clase.
- Acceso: TEACHER, ADMIN

### POST /api/classes/join
- Descripción: Unirse a una clase usando código.
- Acceso: STUDENT
- Body:
  - code (string, required, 6 caracteres)

### GET /api/classes/:classId/students
- Descripción: Listar estudiantes de la clase.
- Acceso: Autenticado (se valida pertenencia en controller)

### DELETE /api/classes/:classId/students/:studentId
- Descripción: Remover estudiante de una clase.
- Acceso: TEACHER, ADMIN

---

## 3. Anuncios

> Rutas montadas en `/api` (definidas en `routes/announcements.js`) para soportar rutas anidadas.

### GET /api/classes/:classId/announcements
- Descripción: Listar anuncios de una clase.
- Acceso: Autenticado

### POST /api/classes/:classId/announcements
- Descripción: Crear anuncio en una clase.
- Acceso: TEACHER, ADMIN
- Body:
  - title (string, required, min 3)
  - content (string, required, min 10)

### DELETE /api/announcements/:announcementId
- Descripción: Eliminar anuncio por ID.
- Acceso: TEACHER, ADMIN

---

## 4. Materiales (resources)

Base (montado en `/api/classes/:classId/materials`)

### GET /api/classes/:classId/materials
- Descripción: Listar materiales de la clase.
- Acceso: Autenticado

### POST /api/classes/:classId/materials
- Descripción: Crear material en la clase.
- Acceso: TEACHER, ADMIN
- Body:
  - title (string, required)
  - description (string, optional)
  - fileUrl (string, optional, URL)
  - link (string, optional, URL)

Nota: el proyecto tiene middleware de subida (`middleware/upload.js`) para manejar archivos; según configuración, algunos endpoints pueden aceptar multipart/form-data.

---

## 5. Tareas

### GET /api/classes/:classId/tasks
- Descripción: Obtener tareas de una clase.
- Acceso: Autenticado

### POST /api/classes/:classId/tasks
- Descripción: Crear tarea en una clase.
- Acceso: TEACHER, ADMIN
- Body:
  - title (string, required, min 3)
  - description (string, required)
  - dueDate (ISO8601 string, required)
  - points (integer, optional, >=0)

### Endpoints individuales de tarea (montados en `/api/tasks`)

#### GET /api/tasks/:taskId
- Descripción: Obtener tarea por ID.
- Acceso: Autenticado

#### PUT /api/tasks/:taskId
- Descripción: Actualizar una tarea.
- Acceso: TEACHER, ADMIN
- Body: campos opcionales (title, description, dueDate, points)

#### DELETE /api/tasks/:taskId
- Descripción: Eliminar una tarea.
- Acceso: TEACHER, ADMIN

---

## 6. Entregas / Submissions

Rutas montadas en `/api` (ver `routes/submissions.js`)

### GET /api/tasks/:taskId/submissions
- Descripción: Obtener todas las entregas de una tarea (para profesor/ADMIN).
- Acceso: TEACHER, ADMIN

### GET /api/tasks/:taskId/my-submission
- Descripción: Obtener la entrega del usuario autenticado para la tarea.
- Acceso: STUDENT

### POST /api/tasks/:taskId/submit
- Descripción: Entregar una tarea (estudiante).
- Acceso: STUDENT
- Body / Form-data: según implementación puede aceptar archivos y/o links

### POST /api/submissions/:submissionId/grade
- Descripción: Calificar una entrega.
- Acceso: TEACHER, ADMIN
- Body:
  - grade (number or integer)
  - feedback (string, optional)

### GET /api/submissions/:submissionId
- Descripción: Obtener entrega por ID.
- Acceso: Autenticado (según permisos)

---

## 7. Usuarios

### PUT /api/users/profile
- Descripción: Actualizar perfil del usuario autenticado.
- Acceso: Autenticado
- Body:
  - name (string, optional, min 3)
  - avatar (string, optional, URL)

---

## 8. Roles y permisos

- ADMIN: acceso completo
- TEACHER: crear/editar clases, tareas, materiales, anuncios y calificar
- STUDENT: unirse a clases, ver materiales, entregar tareas

---

## 9. Notas y buenas prácticas

- Usa `Authorization: Bearer <token>` para endpoints protegidos.
- Valida formas y fechas con los esquemas indicados (express-validator).
- Para operaciones con archivos, revisa `middleware/upload.js` y el controlador correspondiente.
- Los UUIDs se usan para `classId`, `taskId`, `submissionId`, etc.

---

Si querés que incluya ejemplos concretos de request/response (curl o Postman), avisame y los agrego a esta documentación.
