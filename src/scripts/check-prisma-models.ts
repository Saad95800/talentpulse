import prisma from "../lib/prisma.js";

async function checkModels() {
  console.log("Registered Prisma Models:", Object.keys(prisma).filter(k => !k.startsWith("_")));
  try {
    // @ts-ignore
    console.log("Conversation model exists?", !!prisma.conversation);
  } catch (e) {
    console.log("Error accessing prisma.conversation");
  }
}

checkModels().then(() => process.exit(0));
