const { validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 * Utilizado después de las validaciones de express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      error: firstError.msg || 'Error de validación'
    });
  }

  next();
};

/**
 * Alias para compatibilidad con código legacy
 */
const handleValidationErrors = validate;

module.exports = {
  validate,
  handleValidationErrors
};