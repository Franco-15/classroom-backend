const prisma = require('../utils/prisma');

/**
 * @route   GET /api/tasks/:taskId/submissions
 * @desc    Obtener todas las entregas de una tarea
 * @access  TEACHER, ADMIN
 */
const getTaskSubmissions = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verificar que la tarea existe
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { class: true }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }

    // Verificar permisos
    if (req.user.role !== 'ADMIN' && task.class.teacherId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para ver estas entregas'
      });
    }

    const submissions = await prisma.submission.findMany({
      where: { taskId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error getting task submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener entregas'
    });
  }
};

/**
 * @route   GET /api/tasks/:taskId/my-submission
 * @desc    Obtener la entrega del estudiante autenticado
 * @access  STUDENT
 */
const getMySubmission = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verificar que la tarea existe
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { class: true }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }

    // Verificar que el estudiante está inscrito en la clase
    const enrollment = await prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: task.classId,
          studentId: req.user.id
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'No estás inscrito en esta clase'
      });
    }

    const submission = await prisma.submission.findUnique({
      where: {
        taskId_studentId: {
          taskId,
          studentId: req.user.id
        }
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'No has entregado esta tarea aún'
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Error getting my submission:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tu entrega'
    });
  }
};

/**
 * @route   POST /api/tasks/:taskId/submit
 * @desc    Entregar una tarea
 * @access  STUDENT
 */
const submitTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, fileUrl } = req.body;

    // Validar datos
    if (!content || content.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'El contenido debe tener al menos 10 caracteres'
      });
    }

    // Verificar que la tarea existe
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { class: true }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tarea no encontrada'
      });
    }

    // Verificar que el estudiante está inscrito en la clase
    const enrollment = await prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: task.classId,
          studentId: req.user.id
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: 'No estás inscrito en esta clase'
      });
    }

    // Verificar fecha límite
    if (new Date() > new Date(task.dueDate)) {
      return res.status(400).json({
        success: false,
        error: 'La fecha límite de entrega ha pasado'
      });
    }

    // Crear o actualizar entrega
    const submission = await prisma.submission.upsert({
      where: {
        taskId_studentId: {
          taskId,
          studentId: req.user.id
        }
      },
      update: {
        content,
        fileUrl,
        submittedAt: new Date(),
        status: 'SUBMITTED'
      },
      create: {
        taskId,
        studentId: req.user.id,
        content,
        fileUrl,
        status: 'SUBMITTED'
      }
    });

    res.status(201).json({
      success: true,
      data: submission,
      message: 'Tarea entregada exitosamente'
    });
  } catch (error) {
    console.error('Error submitting task:', error);
    res.status(500).json({
      success: false,
      error: 'Error al entregar la tarea'
    });
  }
};

/**
 * @route   POST /api/submissions/:submissionId/grade
 * @desc    Calificar una entrega
 * @access  TEACHER, ADMIN
 */
const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    // Verificar que la entrega existe
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        task: {
          include: { class: true }
        },
        student: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Entrega no encontrada'
      });
    }

    // Verificar permisos
    if (req.user.role !== 'ADMIN' && submission.task.class.teacherId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para calificar esta entrega'
      });
    }

    // Validar calificación
    if (grade === undefined || grade === null) {
      return res.status(400).json({
        success: false,
        error: 'La calificación es requerida'
      });
    }

    if (grade < 0) {
      return res.status(400).json({
        success: false,
        error: 'La calificación no puede ser negativa'
      });
    }

    if (submission.task.points && grade > submission.task.points) {
      return res.status(400).json({
        success: false,
        error: `La calificación no puede superar los ${submission.task.points} puntos`
      });
    }

    // Actualizar entrega con calificación
    const gradedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        grade,
        feedback,
        gradedAt: new Date(),
        status: 'GRADED'
      },
      include: {
        student: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: gradedSubmission,
      message: 'Entrega calificada exitosamente'
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({
      success: false,
      error: 'Error al calificar la entrega'
    });
  }
};

/**
 * @route   GET /api/submissions/:submissionId
 * @desc    Obtener una entrega por ID
 * @access  TEACHER, ADMIN, STUDENT (solo su propia entrega)
 */
const getSubmissionById = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        task: {
          include: {
            class: true
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Entrega no encontrada'
      });
    }

    // Verificar permisos
    const isOwner = submission.studentId === req.user.id;
    const isTeacher = submission.task.class.teacherId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isTeacher && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para ver esta entrega'
      });
    }

    res.json({
      success: true,
      data: {
        ...submission,
        submittedAt: submission.submittedAt.toISOString(),
        gradedAt: submission.gradedAt ? submission.gradedAt.toISOString() : null
      }
    });
  } catch (error) {
    console.error('Error getting submission by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la entrega'
    });
  }
};

module.exports = {
  getTaskSubmissions,
  getMySubmission,
  submitTask,
  gradeSubmission,
  getSubmissionById
};