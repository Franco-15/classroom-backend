const { PrismaClient } = require('@prisma/client');

// Crear instancia única de Prisma Client
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Manejar cierre graceful
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

module.exports = prisma;
