const prisma = require('../utils/prisma');

// GET /api/classes/:classId/materials
exports.getMaterials = async (req, res) => {
    try {
        const { classId } = req.params;

        const materials = await prisma.material.findMany({
            where: { classId },
            include: {
                author: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: materials.map(m => ({
                ...m,
                createdAt: m.createdAt.toISOString()
            }))
        });
    } catch (error) {
        console.error('Get materials error:', error);
        res.status(500).json({ success: false, error: 'Error al obtener materiales.' });
    }
};

// POST /api/classes/:classId/materials
exports.createMaterial = async (req, res) => {
    try {
        const { classId } = req.params;
        const { title, description, fileUrl, link } = req.body;
        const userId = req.user.id;

        if (!fileUrl && !link) {
            return res.status(400).json({ success: false, error: 'Debe proporcionar fileUrl o link.' });
        }

        const classData = await prisma.class.findUnique({ where: { id: classId } });
        if (!classData) {
            return res.status(404).json({ success: false, error: 'Clase no encontrada.' });
        }

        if (classData.teacherId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Sin permisos.' });
        }

        const material = await prisma.material.create({
            data: { classId, title, description, fileUrl, link, authorId: userId },
            include: {
                author: { select: { id: true, name: true } }
            }
        });

        res.status(201).json({
            success: true,
            data: {
                ...material,
                createdAt: material.createdAt.toISOString()
            },
            message: 'Material agregado exitosamente'
        });
    } catch (error) {
        console.error('Create material error:', error);
        res.status(500).json({ success: false, error: 'Error al crear material.' });
    }
};
