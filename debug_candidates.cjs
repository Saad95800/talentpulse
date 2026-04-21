const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--- Derniers Candidats ---");
  const candidates = await prisma.candidate.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  candidates.forEach((c, i) => {
    console.log(`\n[${i}] ID: ${c.id}`);
    console.log(`Nom complet: ${c.name}`);
    console.log(`Prénom: ${c.firstName}`);
    console.log(`Nom: ${c.lastName}`);
    console.log(`Extrait CV Text (100 chars): ${c.cvText.substring(0, 100)}...`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
