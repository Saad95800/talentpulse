"use server";

import prisma from "@/lib/prisma";

/**
 * Récupère le nombre de crédits restants pour un utilisateur.
 * @param userId ID de l'utilisateur
 * @returns Nombre de crédits ou 0 en cas d'erreur
 */
export async function fetchUserCredits(userId: string) {
  if (!userId) return 0;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    return user?.credits ?? 0;
  } catch (error) {
    console.error("Erreur lors de la récupération des crédits:", error);
    return 0;
  }
}
