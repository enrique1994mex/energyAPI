import prisma from '../../src/config/prisma.js';

export async function resetDb() {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

export async function disconnectDb() {
  await prisma.$disconnect();
}
