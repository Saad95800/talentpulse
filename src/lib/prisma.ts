import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return new PrismaClient();
  }

  const url = new URL(connectionString.trim().replace(/^"|"$/g, ''));
  
  const poolConfig = {
    host: url.hostname || '127.0.0.1',
    port: parseInt(url.port || '3306'),
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.substring(1),
    connectionLimit: 10
  };

  const adapter = new PrismaMariaDb(poolConfig);
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobalV3: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobalV3 ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobalV3 = prisma;
