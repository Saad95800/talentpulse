"use server";

import prisma from "@/lib/prisma";
import { subDays, subMonths, startOfDay, endOfDay, startOfMonth, endOfMonth, format } from "date-fns";
import { fr } from "date-fns/locale";
import { verifyToken } from "@/lib/auth";

/**
 * Récupère les données de croissance et de conversion pour le dashboard admin
 */
export async function getGrowthStatsAction(token: string) {
  try {
    const session = verifyToken(token);
    if (!session || session.role !== 'ADMIN') throw new Error("Accès non autorisé.");

    // 1. Inscriptions quotidiennes (30 derniers jours)
    const dailyGrowth = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const start = startOfDay(date);
      const end = endOfDay(date);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        }
      });

      dailyGrowth.push({
        date: format(date, "dd MMM", { locale: fr }),
        inscriptions: count
      });
    }

    // 2. Inscriptions mensuelles (12 derniers mois)
    const monthlyGrowth = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        }
      });

      monthlyGrowth.push({
        month: format(date, "MMM yyyy", { locale: fr }),
        inscriptions: count
      });
    }

    // 3. Tunnel de Conversion (Funnel)
    const totalUsers = await prisma.user.count();
    const verifiedUsers = await prisma.user.count({ where: { isVerified: true } });
    const activeUsers = await prisma.user.count({ where: { totalCreditsUsed: { gt: 0 } } });
    const premiumUsers = await prisma.user.count({ where: { plan: 'PREMIUM' } });

    const funnel = [
      { name: "Inscrits", count: totalUsers, color: "#94a3b8" },
      { name: "Vérifiés", count: verifiedUsers, color: "#6366f1" },
      { name: "Actifs (Match)", count: activeUsers, color: "#3b82f6" },
      { name: "Premium", count: premiumUsers, color: "#10b981" }
    ];

    // 4. Distribution des Plans
    const freeUsers = totalUsers - premiumUsers;

    return {
      success: true,
      growth: {
        daily: dailyGrowth,
        monthly: monthlyGrowth
      },
      funnel,
      stats: {
        totalUsers,
        premiumUsers,
        freeUsers,
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
        activityRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
        paidConversionRate: totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0
      }
    };

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[GrowthActionError]", errorMsg);
    return { success: false, error: errorMsg };
  }
}
