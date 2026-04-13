"use server";

import prisma from "@/lib/prisma";

export async function registerLead(email: string, phone: string) {
  if (!email || !phone) {
    return { success: false, error: "L'email et le téléphone sont obligatoires." };
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: true, user: existingUser };
    }

    // Créer un nouvel utilisateur avec les crédits par défaut (3)
    const newUser = await prisma.user.create({
      data: {
        email,
        phone,
      },
    });

    return { success: true, user: newUser };
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du Lead:", error);
    return { success: false, error: "Une erreur est survenue lors de l'inscription." };
  }
}
