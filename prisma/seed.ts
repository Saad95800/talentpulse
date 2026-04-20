import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

const prismaClientSingleton = () => {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment');
  }

  const url = new URL(connectionString.trim().replace(/^"|"$/g, ''));
  
  const poolConfig = {
    host: url.hostname || '127.0.0.1',
    port: parseInt(url.port || '3306'),
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.substring(1),
    connectionLimit: 1
  };

  const adapter = new PrismaMariaDb(poolConfig);
  return new PrismaClient({ adapter });
};

const prisma = prismaClientSingleton();

async function main() {
  console.log('Starting seeding...');

  const adminEmail = 'contact@reactivedigital.fr';
  const adminPassword = 'OdenNitoryu2t!';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      isVerified: true,
      plan: 'PREMIUM',
      credits: 999999,
      firstName: 'Saad',
      lastName: 'RAJRAJI',
      name: 'Saad RAJRAJI',
      phone: '0756817755',
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
      plan: 'PREMIUM',
      credits: 999999,
      firstName: 'Saad',
      lastName: 'RAJRAJI',
      name: 'Saad RAJRAJI',
      phone: '0756817755',
    },
  });

  console.log('Admin user seeded:', adminUser.email);
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
