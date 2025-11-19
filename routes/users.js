const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { updateProfile } = require('../controllers/userController');

const router = express.Router();

// Validaciones
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('El nombre debe tener mínimo 3 caracteres'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar debe ser una URL válida'),
  validate
];

// PUT /api/users/profile - Actualizar perfil del usuario autenticado
router.put('/profile', auth, updateProfileValidation, updateProfile);

module.exports = router;