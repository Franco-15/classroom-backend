const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const {
  getTaskSubmissions,
  getMySubmission,
  submitTask,
  gradeSubmission,
  getSubmissionById
} = require('../controllers/submissionController');

// Obtener todas las entregas de una tarea (solo profesor)
router.get(
  '/tasks/:taskId/submissions',
  auth,
  requireRole(['TEACHER', 'ADMIN']),
  getTaskSubmissions
);

// Obtener mi entrega (estudiante)
router.get(
  '/tasks/:taskId/my-submission',
  auth,
  requireRole(['STUDENT']),
  getMySubmission
);

// Entregar una tarea (estudiante)
router.post(
  '/tasks/:taskId/submit',
  auth,
  requireRole(['STUDENT']),
  submitTask
);

// Calificar una entrega (profesor)
router.post(
  '/submissions/:submissionId/grade',
  auth,
  requireRole(['TEACHER', 'ADMIN']),
  gradeSubmission
);

// Obtener una entrega por ID
router.get(
  '/submissions/:submissionId',
  auth,
  getSubmissionById
);

module.exports = router;