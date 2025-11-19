const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const authController = require('../controllers/authController');
const { generateTokens } = require('../utils/generateToken');
const passport = require('passport');

const router = express.Router();

// ========================================
// VALIDACIONES
// ========================================

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener mínimo 6 caracteres'),
  body('name')
    .trim()
    .isLength({ min: 3 })
    .withMessage('El nombre debe tener mínimo 3 caracteres'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'TEACHER', 'STUDENT'])
    .withMessage('Rol inválido'),
  validate
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('Contraseña requerida'),
  validate
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token requerido'),
  validate
];

// ========================================
// RUTAS
// ========================================

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refrescar access token
 * @access  Public
 */
router.post('/refresh', refreshTokenValidation, authController.refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener usuario autenticado
 * @access  Private
 */
router.get('/me', auth, authController.getMe);

// Rutas de autenticación con GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/auth/error?message=authentication_failed`
      : 'classroomapp://auth/callback?error=authentication_failed'
  }),
  (req, res) => {
    try {
      // Generar tokens para el usuario autenticado
      const tokens = generateTokens(req.user.id);

      // Detectar si viene de móvil o web
      const isMobile = req.query.platform === 'mobile' || req.headers['user-agent']?.includes('Expo');

      if (isMobile) {
        // Redirigir a la app móvil con deep linking
        const redirectUrl = `classroomapp://auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
        return res.redirect(redirectUrl);
      } else {
        // Redirigir a frontend web
        const webRedirectUrl = process.env.FRONTEND_URL
          ? `${process.env.FRONTEND_URL}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
          : `http://localhost:3000/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
        return res.redirect(webRedirectUrl);
      }
    } catch (error) {
      console.error('Error en GitHub callback:', error);
      const isMobile = req.query.platform === 'mobile' || req.headers['user-agent']?.includes('Expo');

      if (isMobile) {
        return res.redirect('classroomapp://auth/callback?error=token_generation_failed');
      } else {
        const errorUrl = process.env.FRONTEND_URL
          ? `${process.env.FRONTEND_URL}/auth/error?message=token_generation_failed`
          : `http://localhost:3000/auth/error?message=token_generation_failed`;
        return res.redirect(errorUrl);
      }
    }
  }
);

module.exports = router;