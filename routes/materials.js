const express = require('express');
const { body } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const materialController = require('../controllers/materialController');

const router = express.Router({ mergeParams: true });

const createMaterialValidation = [
    body('title').trim().notEmpty().withMessage('Título requerido'),
    body('description').optional().trim(),
    body('fileUrl').optional().isURL().withMessage('fileUrl debe ser una URL válida'),
    body('link').optional().isURL().withMessage('link debe ser una URL válida'),
    validate
];

router.get('/', auth, materialController.getMaterials);
router.post('/', auth, requireRole('TEACHER', 'ADMIN'), createMaterialValidation, materialController.createMaterial);

module.exports = router;