const express = require('express');
const { body, param } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const taskController = require('../controllers/taskController');

const router = express.Router();

const updateTaskValidation = [
    param('taskId').isUUID().withMessage('ID inválido'),
    body('title').optional().trim().isLength({ min: 3 }),
    body('description').optional().trim(),
    body('dueDate').optional().isISO8601(),
    body('points').optional().isInt({ min: 0 }),
    validate
];

// Rutas individuales de tasks
router.get('/:taskId', auth, taskController.getTaskById);
router.put('/:taskId', auth, requireRole('TEACHER', 'ADMIN'), updateTaskValidation, taskController.updateTask);
router.delete('/:taskId', auth, requireRole('TEACHER', 'ADMIN'), taskController.deleteTask);

module.exports = router;