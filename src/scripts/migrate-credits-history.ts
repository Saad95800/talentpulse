import dotenv from "dotenv";
dotenv.config();
import prisma from "../lib/prisma.js";

async function migrate() {
  console.log("Migration: Initialisation de totalCreditsUsed...");
  
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    const recordsCount = await prisma.matchRecord.count({
      where: { userId: user.id }
    });
    
    // Si l'utilisateur est Premium, on peut supposer qu'il a déjà fait pas mal de choses 
    // ou on se base uniquement sur les records réels. On va se baser sur les records réels.
    // NOTE: Si plusieurs records par matching (Batch), ça va surestimer,
    // mais sans autre donnée, c'est le plus proche.
    
    await prisma.user.update({
      where: { id: user.id },
      data: { totalCreditsUsed: recordsCount }
    });
    
    console.log(`- Utilisateur ${user.email} : ${recordsCount} matchings trouvés.`);
  }
  
  console.log("Migration terminée.");
}

migrate().then(() => process.exit(0));
