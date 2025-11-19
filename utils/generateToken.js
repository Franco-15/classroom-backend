const jwt = require('jsonwebtoken');

/**
 * Genera tokens de acceso y refresh para un usuario
 * @param {string} userId - ID del usuario
 * @returns {Object} - Objeto con accessToken y refreshToken
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return {
    accessToken,
    refreshToken
  };
};

/**
 * Verifica un access token
 * @param {string} token - Token a verificar
 * @returns {Object} - Payload decodificado
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verifica un refresh token
 * @param {string} token - Token a verificar
 * @returns {Object} - Payload decodificado
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  );
};

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken
};