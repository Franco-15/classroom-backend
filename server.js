require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./utils/prisma');
const session = require('express-session');
const passport = require('./config/passport');

const app = express();

// ========================================
// MIDDLEWARES
// ========================================
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Logging middleware (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ========================================
// RUTAS
// ========================================

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ Google Classroom MVP API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      classes: '/api/classes',
      users: '/api/users',
      tasks: '/api/tasks',
      submissions: '/api/submissions'
    }
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a base de datos
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      status: 'OK',
      message: 'Servidor y base de datos funcionando correctamente',
      timestamp: new Date().toISOString(),
      database: 'Connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'ERROR',
      message: 'Error en la conexión a la base de datos',
      timestamp: new Date().toISOString(),
      database: 'Disconnected'
    });
  }
});

// ============================================
// 📚 ROUTES
// ============================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api', require('./routes/announcements')); // Montado en /api para soportar rutas anidadas
app.use('/api/classes', require('./routes/materials'));
app.use('/api/classes', require('./routes/tasks'));
app.use('/api/tasks', require('./routes/taskById')); // Rutas individuales de tareas
app.use('/api', require('./routes/submissions')); // Cambiado para que coincida con las rutas definidas
app.use('/api/users', require('./routes/users'));

// ========================================
// MANEJO DE ERRORES
// ========================================

// 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Error interno del servidor'
  });
});

// ========================================
// INICIO DEL SERVIDOR
// ========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log('\n🚀 ========================================');
  console.log(`📚 Google Classroom MVP Backend`);
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log('🚀 ========================================\n');

  // Verificar conexión a base de datos
  try {
    await prisma.$connect();
    console.log('✅ Conectado a MySQL con Prisma');
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    console.log('\n💡 Asegúrate de:');
    console.log('1. Tener MySQL instalado y corriendo');
    console.log('2. Configurar DATABASE_URL en .env');
    console.log('3. Ejecutar: npx prisma migrate dev\n');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n� Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});