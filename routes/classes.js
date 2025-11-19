const express = require('express');
const { body, param } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const classController = require('../controllers/classController');

const router = express.Router();

// Validaciones
const createClassValidation = [
    body('name').trim().isLength({ min: 3 }).withMessage('El nombre debe tener mínimo 3 caracteres'),
    body('description').trim().notEmpty().withMessage('La descripción es requerida'),
    body('subject').optional().trim(),
    validate
];

const updateClassValidation = [
    param('classId').isUUID().withMessage('ID de clase inválido'),
    body('name').optional().trim().isLength({ min: 3 }),
    body('description').optional().trim(),
    body('subject').optional().trim(),
    validate
];

const joinClassValidation = [
    body('code').trim().isLength({ min: 6, max: 6 }).withMessage('Código debe tener 6 caracteres'),
    validate
];

// Rutas
router.get('/all', auth, requireRole(['ADMIN']), classController.getAllClasses);
router.get('/', auth, classController.getClasses);
router.get('/:classId', auth, classController.getClassById);
router.post('/', auth, requireRole(['TEACHER', 'ADMIN']), createClassValidation, classController.createClass);
router.put('/:classId', auth, requireRole(['TEACHER', 'ADMIN']), updateClassValidation, classController.updateClass);
router.delete('/:classId', auth, requireRole(['TEACHER', 'ADMIN']), classController.deleteClass);
router.post('/join', auth, requireRole(['STUDENT']), joinClassValidation, classController.joinClass);
router.get('/:classId/students', auth, classController.getClassStudents);
router.delete('/:classId/students/:studentId', auth, requireRole(['TEACHER', 'ADMIN']), classController.removeStudentFromClass);

module.exports = router;