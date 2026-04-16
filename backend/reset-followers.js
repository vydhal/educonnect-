const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  try {
    const deleted = await prisma.userFollow.deleteMany({});
    console.log('RESET_SUCCESS:', deleted);
  } catch (err) {
    console.error('RESET_ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

reset();
