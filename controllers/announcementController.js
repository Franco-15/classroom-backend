const prisma = require('../utils/prisma');

// GET /api/classes/:classId/announcements
exports.getAnnouncements = async (req, res) => {
    try {
        const { classId } = req.params;

        const announcements = await prisma.announcement.findMany({
            where: { classId },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: announcements.map(a => ({
                ...a,
                createdAt: a.createdAt.toISOString(),
                updatedAt: a.updatedAt.toISOString()
            }))
        });
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ success: false, error: 'Error al obtener anuncios.' });
    }
};

// POST /api/classes/:classId/announcements
exports.createAnnouncement = async (req, res) => {
    try {
        const { classId } = req.params;
        const { title, content } = req.body;
        const userId = req.user.id;

        // Verificar que el usuario es profesor de la clase
        const classData = await prisma.class.findUnique({ where: { id: classId } });
        if (!classData) {
            return res.status(404).json({ success: false, error: 'Clase no encontrada.' });
        }

        if (classData.teacherId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Sin permisos.' });
        }

        const announcement = await prisma.announcement.create({
            data: { classId, title, content, authorId: userId },
            include: {
                author: { select: { id: true, name: true } }
            }
        });

        res.status(201).json({
            success: true,
            data: {
                ...announcement,
                createdAt: announcement.createdAt.toISOString(),
                updatedAt: announcement.updatedAt.toISOString()
            },
            message: 'Anuncio publicado exitosamente'
        });
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ success: false, error: 'Error al crear anuncio.' });
    }
};

// DELETE /api/announcements/:announcementId
exports.deleteAnnouncement = async (req, res) => {
    try {
        const { announcementId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Verificar que el anuncio existe
        const announcement = await prisma.announcement.findUnique({
            where: { id: announcementId },
            include: {
                class: true
            }
        });

        if (!announcement) {
            return res.status(404).json({
                success: false,
                error: 'Anuncio no encontrado.'
            });
        }

        // Verificar permisos (solo autor o profesor de la clase o admin)
        const isAuthor = announcement.authorId === userId;
        const isTeacher = announcement.class.teacherId === userId;
        const isAdmin = userRole === 'ADMIN';

        if (!isAuthor && !isTeacher && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para eliminar este anuncio.'
            });
        }

        // Eliminar anuncio
        await prisma.announcement.delete({
            where: { id: announcementId }
        });

        res.json({
            success: true,
            message: 'Anuncio eliminado exitosamente'
        });

    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar anuncio.'
        });
    }
};
