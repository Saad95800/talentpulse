"use server";

import prisma from "@/lib/prisma";

const ADMIN_EMAIL = "contact@reactivedigital.fr";

/**
 * Récupère le nombre de crédits restants pour un utilisateur.
 * Renvoie un grand nombre (999999) si l'utilisateur est admin (Illimité)
 */
export async function fetchUserCredits(userId: string) {
  if (!userId) return 0;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, email: true },
    });

    if (user?.email === ADMIN_EMAIL) return 999999;
    return user?.credits ?? 0;
  } catch (error) {
    console.error("Erreur lors de la récupération des crédits:", error);
    return 0;
  }
}

/**
 * Vérifie si un utilisateur a encore des crédits sans en déduire (pour le pré-traitement)
 */
export async function checkCredits(userId: string) {
  if (!userId) return { success: false, error: "ID utilisateur manquant." };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Utilisateur introuvable." };

    if (user.email === ADMIN_EMAIL) {
      return { success: true, isUnlimited: true };
    }

    if (user.credits <= 0) {
      return { success: false, error: "Crédits épuisés" };
    }

    return { success: true, isUnlimited: false, currentCredits: user.credits };
  } catch (error) {
    return { success: false, error: "Impossible de vérifier les crédits." };
  }
}

/**
 * Déduit un crédit de manière sécurisée et atomique.
 * Ne déduit rien si le compte est admin.
 */
export async function deductCredit(userId: string) {
  if (!userId) return { success: false, error: "ID utilisateur manquant." };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Utilisateur introuvable." };

    if (user.email === ADMIN_EMAIL) {
      return { success: true, creditsRemaining: 999999 };
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
