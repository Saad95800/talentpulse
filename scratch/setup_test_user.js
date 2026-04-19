import 'dotenv/config.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'contact@reactivedigital.fr';
  const password = '12345678';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      credits: 999999,
    },
    create: {
      email,
      password: hashedPassword,
      name: 'Test Admin',
      role: 'ADMIN',
      credits: 999999,
      phone: '0102030405',
    },
  });

  console.log('Utilisateur de test configuré :', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
