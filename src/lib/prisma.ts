import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as mariadb from 'mariadb';

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ [Prisma] DATABASE_URL is not defined in environment variables.');
    return new PrismaClient(); // Fallback empty
  }

  const cleanUrl = connectionString.trim().replace(/^"|"$/g, '');
  const url = new URL(cleanUrl);
  
  const poolConfig = {
    host: url.hostname || '127.0.0.1',
    port: parseInt(url.port || '3306'),
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.substring(1),
    connectionLimit: 10
  };

  console.log('✅ [Prisma] Initializing PrismaMariaDb with config:', { ...poolConfig, password: '***' });
  const adapter = new PrismaMariaDb(poolConfig);
  
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobalV2: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobalV2 ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobalV2 = prisma;
