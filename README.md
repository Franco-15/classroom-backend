# 📚 Google Classroom MVP - Backend

Backend para una aplicación móvil tipo Google Classroom, construido con **Node.js**, **Express**, **PostgreSQL** y **Prisma ORM**.

## 📌 Resumen rápido

- Base URL: `http://localhost:5000` (por defecto)
- API prefix: `/api`
- Autenticación: JWT (Bearer) + Google / GitHub OAuth

Para la documentación completa de endpoints, ver: `docs/API.md` (se añadió en este repositorio).

## 🎯 Características Principales

- Autenticación JWT con access y refresh tokens
- OAuth con Google y GitHub
- Roles de usuario: `ADMIN`, `TEACHER`, `STUDENT`
- Gestión de clases, anuncios, materiales, tareas y entregas
- Validaciones con `express-validator`
- ORM: Prisma (PostgreSQL)

## 🚀 Inicio Rápido

### Requisitos

- Node.js 16+
- PostgreSQL 14+ (o Docker)
- npm o yarn

### 1) Instalar dependencias

```bash
npm install
```

### 2) Variables de entorno

Copia el ejemplo y configura tus valores:

```bash
cp .env.example .env
```

Rellena `DATABASE_URL`, `SESSION_SECRET`, `JWT_SECRET`, `CORS_ORIGIN`, y las credenciales OAuth si las usás.

### 3) Base de datos / Prisma

```bash
npx prisma generate
npx prisma migrate dev --name init
# (opcional) seed
npm run prisma:seed
```

### 4) Ejecutar

```bash
# Desarrollo (con nodemon si está configurado)
npm run dev

# Producción
npm start
```

El health-check está en `GET /health` y en la raíz (`GET /`) se muestra un resumen de endpoints.

## 📁 Estructura del proyecto

```
project-root/
├── controllers/       # Lógica de negocio
├── middleware/        # Middlewares (auth, upload, validations)
├── routes/            # Rutas (auth, classes, tasks, ...)
├── prisma/            # Esquema y seed
├── utils/             # Utilidades (prisma client, tokens)
├── uploads/           # Archivos subidos
├── server.js          # Punto de entrada
└── package.json
```

## 🔐 Autenticación

El sistema usa `Authorization: Bearer <accessToken>` para endpoints protegidos.
Access tokens con vigencia corta y refresh tokens para regenerarlos.

Endpoints de autenticación (resumen):

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `GET /api/auth/github` (OAuth)

Para la documentación detallada de cada ruta (parámetros, body, roles y ejemplos) consultá `docs/API.md`.

## 🛠️ Comandos útiles

```bash
npm run dev
npm start
npx prisma generate
npx prisma migrate dev --name <name>
npm run prisma:seed
```

## 🔒 Roles y permisos

- `ADMIN`: acceso completo
- `TEACHER`: crear/editar clases, tareas, materiales y calificar
- `STUDENT`: unirse a clases, ver contenidos y entregar tareas

## 🧪 Datos de prueba

El seed crea usuarios de ejemplo (admin, profesores, estudiantes) y algunas clases. Revisá `prisma/seed.js`.

---

Si querés, puedo:

1. Añadir ejemplos `curl` o colecciones Postman a `docs/`.
2. Generar documentación OpenAPI/Swagger a partir de las rutas.

Decime qué preferís y lo agrego.