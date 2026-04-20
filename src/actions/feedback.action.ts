"use server";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { logInfo, logError } from "./logger.action";

/**
 * Enregistre le feedback d'un utilisateur sur un matching spécifique
 */
export async function submitMatchFeedbackAction(token: string, recordId: string, rating: number, comment?: string) {
  try {
    const session = verifyToken(token);
    if (!session) return { success: false, error: "Session expirée." };

    const record = await prisma.matchRecord.findUnique({
      where: { id: recordId }
    });

    if (!record) return { success: false, error: "Matching introuvable." };
    if (record.userId !== session.userId) return { success: false, error: "Non autorisé." };

    await prisma.matchRecord.update({
      where: { id: recordId },
      data: {
        feedbackRating: rating,
        feedbackComment: comment || null
      }
    });

    await logInfo(`Feedback IA reçu: ${rating > 0 ? 'Positif' : 'Négatif'}`, session.userId, { recordId, comment });

    return { success: true };
  } catch (error) {
    console.error("[FeedbackAction] Erreur:", error);
    return { success: false, error: "Impossible d'enregistrer le feedback." };
  }
}

/**
 * Récupère les statistiques de qualité IA pour l'admin
 */
export async function getAIQualityStatsAction(token: string) {
  try {
    const session = verifyToken(token);
    if (!session || session.role !== 'ADMIN') return { success: false, error: "Non autorisé." };

    // Taux de satisfaction global
    const totalWithFeedback = await prisma.matchRecord.count({
      where: { feedbackRating: { not: null } }
    });

    const positiveFeedback = await prisma.matchRecord.count({
      where: { feedbackRating: 1 }
    });

    const negativeFeedbackDetails = await prisma.matchRecord.findMany({
      where: { feedbackRating: -1 },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    const averageScore = await prisma.matchRecord.aggregate({
      _avg: { score: true }
    });

    return {
      success: true,
      stats: {
        totalFeedbacks: totalWithFeedback,
        satisfactionRate: totalWithFeedback > 0 ? (positiveFeedback / totalWithFeedback) * 100 : 0,
        averageAIScore: averageScore._avg.score || 0
      },
      reports: negativeFeedbackDetails
    };
  } catch (error) {
    console.error("[AIQualityStats] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération des stats." };
  }
}
