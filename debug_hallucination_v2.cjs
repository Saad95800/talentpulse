const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
require('dotenv').config();

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
  console.log("--- Investigation Appronfondie Hallucination ---");
  
  const items = await prisma.batchItem.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { matchRecord: true }
  });

  items.forEach((item, i) => {
    console.log(`\n[${i}] Item ID: ${item.id}`);
    console.log(`Statut: ${item.status}`);
    console.log(`Nom Candidat: ${item.candidateName}`);
    console.log(`Erreur: ${item.error}`);
    if (item.matchRecord) {
      console.log(`MatchRecord Score: ${item.matchRecord.score}`);
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
