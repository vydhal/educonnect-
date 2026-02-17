
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log('Total users:', users.length);
        if (users.length > 0) {
            console.log('Users found:', users.map(u => `${u.email} (${u.role})`).join(', '));
        } else {
            console.log('No users found in database.');
        }
    } catch (e) {
        console.error('Error querying database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
