"use server";

import prisma from "@/lib/prisma";

/**
 * Récupère le nombre de crédits restants pour un utilisateur.
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

/**
 * Déduit un crédit de manière sécurisée et atomique.
 * @param userId ID de l'utilisateur
 */
export async function deductCredit(userId: string) {
  if (!userId) return { success: false, error: "ID utilisateur manquant." };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable." };
    }

    if (user.credits <= 0) {
      return { success: false, error: "Crédits épuisés" };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: 1 },
      },
    });

    return { success: true, creditsRemaining: updatedUser.credits };
  } catch (error) {
    console.error("Erreur lors de la déduction du crédit:", error);
    return { success: false, error: "Erreur lors de la déduction du crédit." };
  }
}
