const prisma = require('../utils/prisma');

// GET /api/classes/:classId/tasks
exports.getTasks = async (req, res) => {
    try {
        const { classId } = req.params;

        const tasks = await prisma.task.findMany({
            where: { classId },
            include: {
                author: { select: { id: true, name: true } }
            },
            orderBy: { dueDate: 'asc' }
        });

        res.json({
            success: true,
            data: tasks.map(t => ({
                ...t,
                dueDate: t.dueDate.toISOString(),
                createdAt: t.createdAt.toISOString()
            }))
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ success: false, error: 'Error al obtener tareas.' });
    }
};

// GET /api/tasks/:taskId
exports.getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                author: { select: { id: true, name: true } },
                class: true
            }
        });

        if (!task) {
            return res.status(404).json({ success: false, error: 'Tarea no encontrada.' });
        }

        let responseData = {
            id: task.id,
            classId: task.classId,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate.toISOString(),
            points: task.points,
            authorId: task.authorId,
            author: task.author,
            createdAt: task.createdAt.toISOString()
        };

        // Si es profesor, incluir submissions
        if (task.class.teacherId === userId || userRole === 'ADMIN') {
            const submissions = await prisma.submission.findMany({
                where: { taskId },
                include: {
                    student: {
                        select: { id: true, name: true, email: true }
                    }
                }
            });

            responseData.submissions = submissions.map(s => ({
                ...s,
                submittedAt: s.submittedAt.toISOString(),
                gradedAt: s.gradedAt ? s.gradedAt.toISOString() : null
            }));
        }

        res.json({ success: true, data: responseData });
    } catch (error) {
        console.error('Get task by ID error:', error);
        res.status(500).json({ success: false, error: 'Error al obtener tarea.' });
    }
};

// POST /api/classes/:classId/tasks
exports.createTask = async (req, res) => {
    try {
        const { classId } = req.params;
        const { title, description, dueDate, points } = req.body;
        const userId = req.user.id;

        const classData = await prisma.class.findUnique({ where: { id: classId } });
        if (!classData) {
            return res.status(404).json({ success: false, error: 'Clase no encontrada.' });
        }

        if (classData.teacherId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Sin permisos.' });
        }

        // Validar fecha futura
        if (new Date(dueDate) <= new Date()) {
            return res.status(400).json({ success: false, error: 'La fecha de vencimiento debe ser futura.' });
        }

        const task = await prisma.task.create({
            data: {
                classId,
                title,
                description,
                dueDate: new Date(dueDate),
                points: points || null,
                authorId: userId
            }
        });

        res.status(201).json({
            success: true,
            data: {
                ...task,
                dueDate: task.dueDate.toISOString(),
                createdAt: task.createdAt.toISOString()
            },
            message: 'Tarea creada exitosamente'
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ success: false, error: 'Error al crear tarea.' });
    }
};

// PUT /api/tasks/:taskId
exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, dueDate, points } = req.body;
        const userId = req.user.id;

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { class: true }
        });

        if (!task) {
            return res.status(404).json({ success: false, error: 'Tarea no encontrada.' });
        }

        if (task.authorId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Sin permisos.' });
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (dueDate) {
            if (new Date(dueDate) <= new Date()) {
                return res.status(400).json({ success: false, error: 'La fecha debe ser futura.' });
            }
            updateData.dueDate = new Date(dueDate);
        }
        if (points !== undefined) updateData.points = points;

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: updateData
        });

        res.json({
            success: true,
            data: {
                ...updatedTask,
                dueDate: updatedTask.dueDate.toISOString(),
                createdAt: updatedTask.createdAt.toISOString()
            }
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ success: false, error: 'Error al actualizar tarea.' });
    }
};

// DELETE /api/tasks/:taskId
exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;

        const task = await prisma.task.findUnique({
            where: { id: taskId }
        });

        if (!task) {
            return res.status(404).json({ success: false, error: 'Tarea no encontrada.' });
        }

        if (task.authorId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Sin permisos.' });
        }

        await prisma.task.delete({ where: { id: taskId } });

        res.json({
            success: true,
            message: 'Tarea eliminada exitosamente'
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar tarea.' });
    }
};
