const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de la base de datos...\n');

    // Limpiar base de datos
    console.log('🗑️  Limpiando base de datos...');
    await prisma.submission.deleteMany();
    await prisma.task.deleteMany();
    await prisma.material.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.classEnrollment.deleteMany();
    await prisma.class.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Base de datos limpiada\n');

    // Crear usuarios
    console.log('👤 Creando usuarios...');

    const password = await bcrypt.hash('password123', 12);

    // 1 Admin
    const admin = await prisma.user.create({
        data: {
            email: 'admin@classroom.com',
            password,
            name: 'Administrador Principal',
            role: 'ADMIN',
            avatar: 'https://i.pravatar.cc/150?img=1'
        }
    });
    console.log(`✅ Admin creado: ${admin.email}`);

    // 2 Profesores
    const teacher1 = await prisma.user.create({
        data: {
            email: 'profesor1@classroom.com',
            password,
            name: 'María García',
            role: 'TEACHER',
            avatar: 'https://i.pravatar.cc/150?img=2'
        }
    });
    console.log(`✅ Profesor creado: ${teacher1.email}`);

    const teacher2 = await prisma.user.create({
        data: {
            email: 'profesor2@classroom.com',
            password,
            name: 'Carlos Rodríguez',
            role: 'TEACHER',
            avatar: 'https://i.pravatar.cc/150?img=3'
        }
    });
    console.log(`✅ Profesor creado: ${teacher2.email}`);

    // 5 Estudiantes
    const students = [];
    const studentNames = [
        'Juan Pérez',
        'Ana Martínez',
        'Luis González',
        'Sofia López',
        'Diego Hernández'
    ];

    for (let i = 0; i < 5; i++) {
        const student = await prisma.user.create({
            data: {
                email: `estudiante${i + 1}@classroom.com`,
                password,
                name: studentNames[i],
                role: 'STUDENT',
                avatar: `https://i.pravatar.cc/150?img=${i + 10}`
            }
        });
        students.push(student);
        console.log(`✅ Estudiante creado: ${student.email}`);
    }
    console.log('');

    // Crear clases
    console.log('📚 Creando clases...');

    const class1 = await prisma.class.create({
        data: {
            name: 'Matemáticas Avanzadas',
            description: 'Curso de matemáticas nivel secundaria',
            code: 'MAT101',
            subject: 'Matemáticas',
            teacherId: teacher1.id
        }
    });
    console.log(`✅ Clase creada: ${class1.name} (${class1.code})`);

    const class2 = await prisma.class.create({
        data: {
            name: 'Historia Universal',
            description: 'Historia desde la antigüedad hasta la época moderna',
            code: 'HIS201',
            subject: 'Historia',
            teacherId: teacher2.id
        }
    });
    console.log(`✅ Clase creada: ${class2.name} (${class2.code})`);

    const class3 = await prisma.class.create({
        data: {
            name: 'Programación Web',
            description: 'Desarrollo web con HTML, CSS y JavaScript',
            code: 'PRG301',
            subject: 'Programación',
            teacherId: teacher1.id
        }
    });
    console.log(`✅ Clase creada: ${class3.name} (${class3.code})`);
    console.log('');

    // Inscribir estudiantes en clases
    console.log('🎓 Inscribiendo estudiantes...');

    // Clase 1: Todos los estudiantes
    for (const student of students) {
        await prisma.classEnrollment.create({
            data: {
                classId: class1.id,
                studentId: student.id
            }
        });
    }
    console.log(`✅ ${students.length} estudiantes inscritos en ${class1.name}`);

    // Clase 2: Primeros 3 estudiantes
    for (let i = 0; i < 3; i++) {
        await prisma.classEnrollment.create({
            data: {
                classId: class2.id,
                studentId: students[i].id
            }
        });
    }
    console.log(`✅ 3 estudiantes inscritos en ${class2.name}`);

    // Clase 3: Últimos 2 estudiantes
    for (let i = 3; i < 5; i++) {
        await prisma.classEnrollment.create({
            data: {
                classId: class3.id,
                studentId: students[i].id
            }
        });
    }
    console.log(`✅ 2 estudiantes inscritos en ${class3.name}`);
    console.log('');

    // Crear anuncios
    console.log('📢 Creando anuncios...');

    await prisma.announcement.create({
        data: {
            classId: class1.id,
            title: 'Bienvenidos a Matemáticas Avanzadas',
            content: 'Este es nuestro primer anuncio. Prepárense para un gran semestre.',
            authorId: teacher1.id
        }
    });

    await prisma.announcement.create({
        data: {
            classId: class2.id,
            title: 'Recordatorio: Examen próxima semana',
            content: 'No olviden estudiar los capítulos 1-3 del libro.',
            authorId: teacher2.id
        }
    });
    console.log('✅ Anuncios creados\n');

    // Crear materiales
    console.log('📎 Creando materiales...');

    await prisma.material.create({
        data: {
            classId: class1.id,
            title: 'Guía de Álgebra',
            description: 'Material de estudio para el primer parcial',
            fileUrl: 'https://example.com/algebra-guide.pdf',
            authorId: teacher1.id
        }
    });

    await prisma.material.create({
        data: {
            classId: class3.id,
            title: 'Tutorial de JavaScript',
            link: 'https://javascript.info',
            authorId: teacher1.id
        }
    });
    console.log('✅ Materiales creados\n');

    // Crear tareas
    console.log('📝 Creando tareas...');

    const task1 = await prisma.task.create({
        data: {
            classId: class1.id,
            title: 'Resolver ecuaciones cuadráticas',
            description: 'Resolver los ejercicios del 1 al 10 de la página 45',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
            points: 100,
            authorId: teacher1.id
        }
    });
    console.log(`✅ Tarea creada: ${task1.title}`);

    const task2 = await prisma.task.create({
        data: {
            classId: class2.id,
            title: 'Ensayo sobre la Revolución Francesa',
            description: 'Escribir un ensayo de 2 páginas sobre las causas de la Revolución Francesa',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días
            points: 50,
            authorId: teacher2.id
        }
    });
    console.log(`✅ Tarea creada: ${task2.title}`);

    const task3 = await prisma.task.create({
        data: {
            classId: class3.id,
            title: 'Crear página web con HTML y CSS',
            description: 'Crear una página web personal usando HTML5 y CSS3',
            dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 días
            points: 100,
            authorId: teacher1.id
        }
    });
    console.log(`✅ Tarea creada: ${task3.title}`);
    console.log('');

    // Crear entregas
    console.log('📤 Creando entregas de ejemplo...');

    // Estudiante 1 entrega tarea 1
    const submission1 = await prisma.submission.create({
        data: {
            taskId: task1.id,
            studentId: students[0].id,
            content: 'He resuelto todos los ejercicios. Aquí están mis respuestas...',
            status: 'SUBMITTED'
        }
    });
    console.log(`✅ ${students[0].name} entregó: ${task1.title}`);

    // Estudiante 2 entrega tarea 1 y ya está calificada
    const submission2 = await prisma.submission.create({
        data: {
            taskId: task1.id,
            studentId: students[1].id,
            content: 'Ejercicios completados con procedimiento detallado.',
            grade: 95,
            feedback: 'Excelente trabajo, muy ordenado y completo.',
            gradedAt: new Date(),
            status: 'GRADED'
        }
    });
    console.log(`✅ ${students[1].name} entregó y fue calificado: ${task1.title}`);

    // Estudiante 1 entrega tarea 2
    await prisma.submission.create({
        data: {
            taskId: task2.id,
            studentId: students[0].id,
            content: 'Mi ensayo sobre la Revolución Francesa analiza las causas económicas, sociales y políticas...',
            fileUrl: 'https://example.com/essay-revolucion-francesa.pdf',
            status: 'SUBMITTED'
        }
    });
    console.log(`✅ ${students[0].name} entregó: ${task2.title}`);

    console.log('\n✨ ========================================');
    console.log('✨ Seed completado exitosamente!');
    console.log('✨ ========================================\n');

    console.log('📊 Resumen de datos creados:');
    console.log(`   👤 Usuarios: ${1 + 2 + 5} (1 admin, 2 profesores, 5 estudiantes)`);
    console.log(`   📚 Clases: 3`);
    console.log(`   🎓 Inscripciones: ${students.length + 3 + 2}`);
    console.log(`   📢 Anuncios: 2`);
    console.log(`   📎 Materiales: 2`);
    console.log(`   📝 Tareas: 3`);
    console.log(`   📤 Entregas: 3\n`);

    console.log('🔐 Credenciales de acceso:');
    console.log('   Admin: admin@classroom.com / password123');
    console.log('   Profesor 1: profesor1@classroom.com / password123');
    console.log('   Profesor 2: profesor2@classroom.com / password123');
    console.log('   Estudiante 1: estudiante1@classroom.com / password123');
    console.log('   Estudiante 2: estudiante2@classroom.com / password123');
    console.log('   ... (hasta estudiante5@classroom.com)\n');

    console.log('📚 Códigos de clase:');
    console.log(`   ${class1.name}: ${class1.code}`);
    console.log(`   ${class2.name}: ${class2.code}`);
    console.log(`   ${class3.name}: ${class3.code}\n`);
}

main()
    .catch((e) => {
        console.error('❌ Error durante el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
