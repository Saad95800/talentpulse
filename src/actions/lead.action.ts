"use server";

import prisma from "@/lib/prisma";

export async function registerLead(name: string, email: string, phone: string) {
  if (!name || !email || !phone) {
    return { success: false, error: "Tous les champs sont obligatoires." };
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
        name,
        email,
        phone,
      },
    });

    return { success: true, user: newUser };
  } catch (error: any) {
    console.error("Erreur registerLead:", error);
    return { success: false, error: "Erreur: " + error?.message || error?.toString() || "Inconnue" };
  }
}
