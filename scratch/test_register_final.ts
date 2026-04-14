
import prisma from '../src/lib/prisma.js';
import { registerAction } from '../src/actions/auth.action.js';

// Note: In ESM, we need extensions or a proper loader. 
// Since I'm using ts-node, I'll try without extensions first.

async function test() {
  console.log("--- TEST INSCRIPTION ---");
  
  const testDataArray = [
    {
        name: "Saad RAJRAJI Test",
        email: "rs.test@example.com",
        phone: "0756817755",
        password: "password123"
    }
  ];

  console.log("1. Test avec Payload Tableau...");
  const res1 = await registerAction(testDataArray);
  console.log("Résultat 1:", res1);

  console.log("\n2. Test avec Payload Objet (Email existant)...");
  const res2 = await registerAction(testDataArray[0]);
  console.log("Résultat 2:", res2);

  // Nettoyage
  await prisma.user.deleteMany({
    where: { email: "rs.test@example.com" }
  });
  console.log("\nNettoyage effectué.");
  
  await prisma.$disconnect();
}

test().catch(console.error);
