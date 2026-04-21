const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--- Investigation Jean-Baptiste LOUVET ---");
  
  const items = await prisma.batchItem.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { matchRecord: true }
  });

  items.forEach((item, i) => {
    console.log(`\n[${i}] Item ID: ${item.id}`);
    console.log(`Statut: ${item.status}`);
    console.log(`Nom Candidat: ${item.candidateName}`);
    console.log(`Erreur: ${item.error}`);
    if (item.matchRecord) {
      console.log(`MatchRecord Score: ${item.matchRecord.score}`);
      console.log(`MatchRecord AI Response (partial): ${JSON.stringify(item.matchRecord.aiResponse).substring(0, 200)}`);
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
