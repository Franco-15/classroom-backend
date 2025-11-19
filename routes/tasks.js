const express = require('express');
const { body, param } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const taskController = require('../controllers/taskController');

const router = express.Router();

const createTaskValidation = [
    body('title').trim().isLength({ min: 3 }).withMessage('Título mínimo 3 caracteres'),
    body('description').trim().notEmpty().withMessage('Descripción requerida'),
    body('dueDate').isISO8601().withMessage('Fecha inválida'),
    body('points').optional().isInt({ min: 0 }).withMessage('Puntos deben ser >= 0'),
    validate
];

const updateTaskValidation = [
    param('taskId').isUUID().withMessage('ID inválido'),
    body('title').optional().trim().isLength({ min: 3 }),
    body('description').optional().trim(),
    body('dueDate').optional().isISO8601(),
    body('points').optional().isInt({ min: 0 }),
    validate
];

// Rutas anidadas en classes
router.get('/:classId/tasks', auth, taskController.getTasks);
router.post('/:classId/tasks', auth, requireRole('TEACHER', 'ADMIN'), createTaskValidation, taskController.createTask);

module.exports = router;