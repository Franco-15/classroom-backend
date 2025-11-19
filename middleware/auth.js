const prisma = require('../utils/prisma');
const { verifyAccessToken } = require('../utils/generateToken');

/**
 * Middleware de autenticación
 * Verifica el token JWT y agrega el usuario a req.user
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Acceso denegado. Token no proporcionado.'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verificar token
    const decoded = verifyAccessToken(token);

    // Buscar usuario en base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido. Usuario no encontrado.'
      });
    }

    // Agregar usuario a request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado. Por favor, refresca tu token.'
      });
    }

    res.status(401).json({
      success: false,
      error: 'Error de autenticación.'
    });
  }
};

/**
 * Middleware para verificar roles
 * @param {string|string[]} roles - Rol(es) permitido(s) (ej: 'ADMIN' o ['ADMIN', 'TEACHER'])
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado.'
      });
    }

    // Normalizar a array si es un string
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado. Permisos insuficientes.'
      });
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, solo agrega el usuario si existe
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Si hay error, simplemente continuar sin usuario
    next();
  }
};

module.exports = {
  auth,
  requireRole,
  optionalAuth
};