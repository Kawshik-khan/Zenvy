import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      uniqueId: null
    }
  });

  for (const user of users) {
    const baseName = (user.name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
    const uniqueId = `${baseName}_${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    await prisma.user.update({
      where: { id: user.id },
      data: { uniqueId }
    });
    console.log(`Updated user ${user.email} with uniqueId ${uniqueId}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
