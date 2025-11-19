const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Genera un código único de 6 caracteres para una clase
 * Formato: Letras mayúsculas y números (ej: "ABC123")
 * @returns {Promise<string>} - Código único generado
 */
const generateClassCode = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let isUnique = false;

    while (!isUnique) {
        // Generar código de 6 caracteres
        code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        // Verificar si el código ya existe
        const existingClass = await prisma.class.findUnique({
            where: { code }
        });

        if (!existingClass) {
            isUnique = true;
        }
    }

    return code;
};

module.exports = {
    generateClassCode
};
