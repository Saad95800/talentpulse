
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const email = "rs.mailpro@gmail.com";
    console.log("Checking if user exists:", email);
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    console.log("Existing user:", existingUser);

    if (!existingUser) {
      console.log("Attempting to create user...");
      // Simuler registerAction sans l'envoi de mail pour isoler l'erreur DB
      const res = await prisma.user.create({
        data: {
          name: "Saad RAJRAJI",
          email: "rs.mailpro@gmail.com",
          phone: "0756817755",
          password: "fake_hashed_password",
          verificationToken: "test_token",
          isVerified: false,
          credits: 3,
        },
      });
      console.log("User created successfully:", res.id);
    } else {
        console.log("User already exists, deleting to retry test...");
        await prisma.user.delete({ where: { email } });
        console.log("User deleted. Run script again to test creation.");
    }
  } catch (error) {
    console.error("DEBUG ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
