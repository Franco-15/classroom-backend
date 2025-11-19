const prisma = require('../utils/prisma');
const { generateClassCode } = require('../utils/generateClassCode');

// ========================================
// 6. GET /api/classes - Obtener todas las clases del usuario
// ========================================
exports.getClasses = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let classes;

        if (userRole === 'TEACHER' || userRole === 'ADMIN') {
            // Obtener clases creadas por el profesor
            classes = await prisma.class.findMany({
                where: { teacherId: userId },
                include: {
                    teacher: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    _count: {
                        select: { enrollments: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            // Formatear respuesta
            classes = classes.map(c => ({
                id: c.id,
                name: c.name,
                description: c.description,
                code: c.code,
                teacherId: c.teacherId,
                teacher: c.teacher,
                subject: c.subject,
                createdAt: c.createdAt.toISOString(),
                studentsCount: c._count.enrollments
            }));

        } else {
            // STUDENT: Obtener clases en las que está inscrito
            const enrollments = await prisma.classEnrollment.findMany({
                where: { studentId: userId },
                include: {
                    class: {
                        include: {
                            teacher: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
                                }
                            },
                            _count: {
                                select: { enrollments: true }
                            }
                        }
                    }
                },
                orderBy: { joinedAt: 'desc' }
            });

            classes = enrollments.map(e => ({
                id: e.class.id,
                name: e.class.name,
                description: e.class.description,
                code: e.class.code,
                teacherId: e.class.teacherId,
                teacher: e.class.teacher,
                subject: e.class.subject,
                createdAt: e.class.createdAt.toISOString(),
                studentsCount: e.class._count.enrollments
            }));
        }

        res.json({
            success: true,
            data: classes
        });

    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener clases.'
        });
    }
};

// ========================================
// 7. GET /api/classes/:classId - Obtener detalles de una clase
// ========================================
exports.getClassById = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const classData = await prisma.class.findUnique({
            where: { id: classId },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true
                    }
                },
                enrollments: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar: true
                            }
                        }
                    }
                },
                announcements: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                materials: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                tasks: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: { dueDate: 'asc' }
                }
            }
        });

        if (!classData) {
            return res.status(404).json({
                success: false,
                error: 'Clase no encontrada.'
            });
        }

        // Verificar permisos
        const isTeacher = classData.teacherId === userId;
        const isEnrolled = classData.enrollments.some(e => e.studentId === userId);

        if (!isTeacher && !isEnrolled && userRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'No tienes acceso a esta clase.'
            });
        }

        // Formatear respuesta
        const response = {
            id: classData.id,
            name: classData.name,
            description: classData.description,
            code: classData.code,
            teacherId: classData.teacherId,
            teacher: classData.teacher,
            subject: classData.subject,
            createdAt: classData.createdAt.toISOString(),
            students: classData.enrollments.map(e => e.student),
            announcements: classData.announcements.map(a => ({
                ...a,
                createdAt: a.createdAt.toISOString(),
                updatedAt: a.updatedAt.toISOString()
            })),
            materials: classData.materials.map(m => ({
                ...m,
                createdAt: m.createdAt.toISOString()
            })),
            tasks: classData.tasks.map(t => ({
                ...t,
                dueDate: t.dueDate.toISOString(),
                createdAt: t.createdAt.toISOString()
            }))
        };

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Get class by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener clase.'
        });
    }
};

// ========================================
// 8. POST /api/classes - Crear nueva clase
// ========================================
exports.createClass = async (req, res) => {
    try {
        const { name, description, subject } = req.body;
        const teacherId = req.user.id;

        // Generar código único
        const code = await generateClassCode();

        const newClass = await prisma.class.create({
            data: {
                name,
                description,
                subject,
                code,
                teacherId
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: {
                id: newClass.id,
                name: newClass.name,
                description: newClass.description,
                code: newClass.code,
                teacherId: newClass.teacherId,
                subject: newClass.subject,
                createdAt: newClass.createdAt.toISOString(),
                studentsCount: 0
            },
            message: 'Clase creada exitosamente'
        });

    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear clase.'
        });
    }
};

// ========================================
// 9. PUT /api/classes/:classId - Actualizar clase
// ========================================
exports.updateClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const { name, description, subject } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        const classData = await prisma.class.findUnique({
            where: { id: classId }
        });

        if (!classData) {
            return res.status(404).json({
                success: false,
                error: 'Clase no encontrada.'
            });
        }

        // Verificar permisos
        if (classData.teacherId !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para editar esta clase.'
            });
        }

        const updatedClass = await prisma.class.update({
            where: { id: classId },
            data: {
                ...(name && { name }),
                ...(description && { description }),
                ...(subject !== undefined && { subject })
            },
            include: {
                _count: {
                    select: { enrollments: true }
                }
            }
        });

        res.json({
            success: true,
            data: {
                id: updatedClass.id,
                name: updatedClass.name,
                description: updatedClass.description,
                code: updatedClass.code,
                teacherId: updatedClass.teacherId,
                subject: updatedClass.subject,
                createdAt: updatedClass.createdAt.toISOString(),
                studentsCount: updatedClass._count.enrollments
            }
        });

    } catch (error) {
        console.error('Update class error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar clase.'
        });
    }
};

// ========================================
// 10. DELETE /api/classes/:classId - Eliminar clase
// ========================================
exports.deleteClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const classData = await prisma.class.findUnique({
            where: { id: classId }
        });

        if (!classData) {
            return res.status(404).json({
                success: false,
                error: 'Clase no encontrada.'
            });
        }

        // Verificar permisos
        if (classData.teacherId !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para eliminar esta clase.'
            });
        }

        await prisma.class.delete({
            where: { id: classId }
        });

        res.json({
            success: true,
            message: 'Clase eliminada exitosamente'
        });

    } catch (error) {
        console.error('Delete class error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar clase.'
        });
    }
};

// ========================================
// 11. POST /api/classes/join - Unirse a una clase con código
// ========================================
exports.joinClass = async (req, res) => {
    try {
        const { code } = req.body;
        const studentId = req.user.id;
        const userRole = req.user.role;

        // Solo estudiantes pueden unirse
        if (userRole !== 'STUDENT') {
            return res.status(403).json({
                success: false,
                error: 'Solo los estudiantes pueden unirse a clases.'
            });
        }

        // Buscar clase por código
        const classData = await prisma.class.findUnique({
            where: { code: code.toUpperCase() },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: {
                    select: { enrollments: true }
                }
            }
        });

        if (!classData) {
            return res.status(404).json({
                success: false,
                error: 'Código de clase inválido.'
            });
        }

        // Verificar si ya está inscrito
        const existingEnrollment = await prisma.classEnrollment.findUnique({
            where: {
                classId_studentId: {
                    classId: classData.id,
                    studentId
                }
            }
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                error: 'Ya estás inscrito en esta clase.'
            });
        }

        // Crear inscripción
        await prisma.classEnrollment.create({
            data: {
                classId: classData.id,
                studentId
            }
        });

        res.json({
            success: true,
            data: {
                id: classData.id,
                name: classData.name,
                description: classData.description,
                code: classData.code,
                teacherId: classData.teacherId,
                teacher: classData.teacher,
                subject: classData.subject,
                createdAt: classData.createdAt.toISOString(),
                studentsCount: classData._count.enrollments + 1
            },
            message: 'Te has unido a la clase exitosamente'
        });

    } catch (error) {
        console.error('Join class error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al unirse a la clase.'
        });
    }
};

// ========================================
// 12. GET /api/classes/:classId/students - Obtener estudiantes de una clase
// ========================================
exports.getClassStudents = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const classData = await prisma.class.findUnique({
            where: { id: classId }
        });

        if (!classData) {
            return res.status(404).json({
                success: false,
                error: 'Clase no encontrada.'
            });
        }

        // Verificar permisos (solo profesor o admin)
        if (classData.teacherId !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para ver los estudiantes.'
            });
        }

        const enrollments = await prisma.classEnrollment.findMany({
            where: { classId },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        role: true,
                        createdAt: true
                    }
                }
            },
            orderBy: { joinedAt: 'desc' }
        });

        const students = enrollments.map(e => ({
            ...e.student,
            createdAt: e.student.createdAt.toISOString()
        }));

        res.json({
            success: true,
            data: students
        });

    } catch (error) {
        console.error('Get class students error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estudiantes.'
        });
    }
};

// ========================================
// 13. DELETE /api/classes/:classId/students/:studentId - Remover estudiante de clase
// ========================================
exports.removeStudentFromClass = async (req, res) => {
    try {
        const { classId, studentId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const classData = await prisma.class.findUnique({
            where: { id: classId }
        });

        if (!classData) {
            return res.status(404).json({
                success: false,
                error: 'Clase no encontrada.'
            });
        }

        // Verificar permisos (solo profesor de la clase o admin)
        if (classData.teacherId !== userId && userRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para remover estudiantes.'
            });
        }

        // Verificar que la inscripción existe
        const enrollment = await prisma.classEnrollment.findUnique({
            where: {
                classId_studentId: {
                    classId,
                    studentId
                }
            }
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                error: 'El estudiante no está inscrito en esta clase.'
            });
        }

        // Eliminar inscripción
        await prisma.classEnrollment.delete({
            where: {
                classId_studentId: {
                    classId,
                    studentId
                }
            }
        });

        res.json({
            success: true,
            message: 'Estudiante removido de la clase exitosamente'
        });

    } catch (error) {
        console.error('Remove student from class error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al remover estudiante.'
        });
    }
};

// ========================================
// 14. GET /api/classes/all - Obtener todas las clases (ADMIN)
// ========================================
exports.getAllClasses = async (req, res) => {
    try {
        const userRole = req.user.role;

        // Solo admin puede ver todas las clases
        if (userRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para ver todas las clases.'
            });
        }

        const classes = await prisma.class.findMany({
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        enrollments: true,
                        tasks: true,
                        announcements: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedClasses = classes.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            code: c.code,
            teacherId: c.teacherId,
            teacher: c.teacher,
            subject: c.subject,
            createdAt: c.createdAt.toISOString(),
            studentsCount: c._count.enrollments,
            tasksCount: c._count.tasks,
            announcementsCount: c._count.announcements
        }));

        res.json({
            success: true,
            data: formattedClasses
        });

    } catch (error) {
        console.error('Get all classes error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener todas las clases.'
        });
    }
};
