const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'contact@reactivedigital.fr';
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.error(`User ${email} not found.`);
    return;
  }

  console.log('Current user info:', JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified
  }, null, 2));

  if (user.role !== 'ADMIN') {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' }
    });
    console.log(`✅ Role updated to ADMIN for ${email}`);
  } else {
    console.log(`ℹ️ User ${email} is already ADMIN.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
