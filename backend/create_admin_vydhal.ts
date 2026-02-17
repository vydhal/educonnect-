
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'vydhal@gmail.com';
    const password = 'Vydhal@112358';
    const name = 'Vydhal Admin';

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            console.log('User already exists.');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'ADMIN',
                verified: true,
                school: 'Secretaria de Educação'
            }
        });

        console.log(`User ${user.email} (ADMIN) created successfully.`);
    } catch (e) {
        console.error('Error creating admin:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
