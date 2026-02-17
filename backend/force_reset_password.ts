
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'vydhal@gmail.com';
    const newPassword = 'Vydhal@112358';

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log(`User ${email} not found! Creating it...`);
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await prisma.user.create({
                data: {
                    name: 'Vydhal Admin',
                    email,
                    password: hashedPassword,
                    role: 'ADMIN',
                    verified: true,
                    school: 'Secretaria de Educação'
                }
            });
            console.log('User created.');
        } else {
            console.log(`User ${email} found. Updating password...`);
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            });
            console.log('Password updated.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
