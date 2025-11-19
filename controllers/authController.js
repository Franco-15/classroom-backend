const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { generateTokens, verifyRefreshToken } = require('../utils/generateToken');

// ========================================
// 1. REGISTRO (POST /api/auth/register)
// ========================================
exports.register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Validar que role sea válido
    const validRoles = ['ADMIN', 'TEACHER', 'STUDENT'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rol inválido. Debe ser ADMIN, TEACHER o STUDENT.'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está registrado.'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'STUDENT'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });

    // Generar tokens
    const tokens = generateTokens(user.id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          ...user,
          createdAt: user.createdAt.toISOString()
        },
        tokens
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar usuario.'
    });
  }
};

// ========================================
// 2. LOGIN (POST /api/auth/login)
// ========================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos.'
      });
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas.'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas.'
      });
    }

    // Generar tokens
    const tokens = generateTokens(user.id);

    // Preparar respuesta sin password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: {
          ...userWithoutPassword,
          createdAt: user.createdAt.toISOString()
        },
        tokens
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión.'
    });
  }
};

// ========================================
// 3. REFRESH TOKEN (POST /api/auth/refresh)
// ========================================
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token requerido.'
      });
    }

    // Verificar refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token inválido o expirado.'
      });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado.'
      });
    }

    // Generar nuevos tokens
    const tokens = generateTokens(user.id);

    res.json({
      success: true,
      data: tokens
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al refrescar token.'
    });
  }
};

// ========================================
// 4. GET ME (GET /api/auth/me)
// ========================================
exports.getMe = async (req, res) => {
  try {
    // El usuario ya está en req.user por el middleware auth
    res.json({
      success: true,
      data: {
        ...req.user,
        createdAt: req.user.createdAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuario.'
    });
  }
};