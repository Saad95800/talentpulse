import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'contact@reactivedigital.fr' },
  });
  
  if (user) {
    console.log('Utilisateur trouvé :', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      credits: user.credits,
    });
  } else {
    console.log('Utilisateur NON trouvé.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
