const express = require('express');
const { body, param } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const announcementController = require('../controllers/announcementController');

const router = express.Router();

const createAnnouncementValidation = [
    body('title').trim().isLength({ min: 3 }).withMessage('Título mínimo 3 caracteres'),
    body('content').trim().isLength({ min: 10 }).withMessage('Contenido mínimo 10 caracteres'),
    validate
];

// Rutas anidadas bajo /api/classes
// GET /api/classes/:classId/announcements
router.get('/classes/:classId/announcements', auth, announcementController.getAnnouncements);

// POST /api/classes/:classId/announcements
router.post('/classes/:classId/announcements', auth, requireRole(['TEACHER', 'ADMIN']), createAnnouncementValidation, announcementController.createAnnouncement);

// Rutas individuales bajo /api/announcements
// DELETE /api/announcements/:announcementId
router.delete('/announcements/:announcementId', auth, requireRole(['TEACHER', 'ADMIN']), announcementController.deleteAnnouncement);

module.exports = router;