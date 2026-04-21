"use server";

import prisma from "@/lib/prisma";
import { differenceInDays } from 'date-fns';
import { sendLowCreditsEmail } from '@/lib/mail';

/**
 * Assure que les crédits de l'utilisateur sont réinitialisés s'il s'agit d'une nouvelle semaine (Forfait FREE)
 */
async function ensureWeeklyReset(userId: string) {
  if (!userId) return;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        plan: true, 
        credits: true, 
        lastCreditReset: true 
      }
    });

    if (!user || user.plan !== 'FREE') return;

    const now = new Date();
    const lastReset = user.lastCreditReset ? new Date(user.lastCreditReset) : null;

    // Si on a jamais reset, ou si le dernier reset date de plus de 7 jours
    if (!lastReset || differenceInDays(now, lastReset) >= 7) {
      console.log(`[Credits] Réinitialisation hebdomadaire pour ${userId} (Dernier reset: ${lastReset})`);
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: 3, // Réinitialisé à 3 (non cumulable par semaine)
          lastCreditReset: now
        }
      });
    }
  } catch (error) {
    console.error("[Credits] Erreur lors de la réinitialisation hebdomadaire:", error);
  }
}

/**
 * Récupère le nombre de crédits restants pour un utilisateur.
 * Renvoie un grand nombre (999999) si l'utilisateur est admin (Illimité)
 */
export async function fetchUserCredits(userId: string) {
  if (!userId) return 0;

  try {
    await ensureWeeklyReset(userId);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, role: true },
    });

    if (user?.role === 'ADMIN') return 999999;
    return user?.credits ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Vérifie si un utilisateur a encore des crédits sans en déduire (pour le pré-traitement)
 */
export async function checkCredits(userId: string) {
  if (!userId) return { success: false, error: "ID utilisateur manquant." };

  try {
    await ensureWeeklyReset(userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Utilisateur introuvable." };

    if (user.role === 'ADMIN') {
      return { success: true, isUnlimited: true };
    }

    if (user.credits <= 0) {
      return { success: false, error: "Crédits épuisés" };
    }

    return { success: true, isUnlimited: false, currentCredits: user.credits };
  } catch {
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
    await ensureWeeklyReset(userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Utilisateur introuvable." };

    if (user.role === 'ADMIN') {
      return { success: true, creditsRemaining: 999999 };
    }

    if (user.credits <= 0) {
      return { success: false, error: "Crédits épuisés" };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: 1 },
        totalCreditsUsed: { increment: 1 }
      },
    });

    // Alerte si crédits épuisés
    if (updatedUser.credits === 0) {
      // Fire-and-forget pour ne pas bloquer le matching
      sendLowCreditsEmail(updatedUser.email, updatedUser.plan).catch(err => {
        console.error("[Credits:EmailAlertFailed]", err);
      });
    }

    return { success: true, creditsRemaining: updatedUser.credits };
  } catch {
    return { success: false, error: "Erreur lors de la déduction du crédit." };
  }
}
