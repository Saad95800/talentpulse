"use server";

import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { fr } from "date-fns/locale";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function getFinancialStatsAction(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JWTPayload;
    if (decoded.role !== 'ADMIN') throw new Error("Accès non autorisé.");

    // 1. Chiffre d'affaire Total
    const payments = await prisma.molliePayment.findMany({
      where: { status: 'paid' },
      select: { amount: true, createdAt: true, user: { select: { email: true, name: true } } }
    });

    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

    // 2. MRR (Monthly Recurring Revenue)
    // On compte les abonnements actifs à 49.99€
    const activeSubscribersCount = await prisma.user.count({
      where: {
        plan: 'PREMIUM',
        subscriptionStatus: 'active'
      }
    });
    const mrr = activeSubscribersCount * 49.99;

    // 3. Taux de Conversion
    const totalUsers = await prisma.user.count();
    const conversionRate = totalUsers > 0 ? (activeSubscribersCount / totalUsers) * 100 : 0;

    // 4. Historique des Revenus (12 derniers mois)
    const history = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthlyRevenue = await prisma.molliePayment.aggregate({
        where: {
          status: 'paid',
          createdAt: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          amount: true
        }
      });

      history.push({
        month: format(date, "MMM", { locale: fr }),
        fullName: format(date, "MMMM yyyy", { locale: fr }),
        revenue: monthlyRevenue._sum.amount || 0
      });
    }

    // 5. Dernières transactions
    const recentTransactions = await prisma.molliePayment.findMany({
      where: { status: 'paid' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return {
      success: true,
      stats: {
        totalRevenue,
        mrr,
        conversionRate,
        totalUsers,
        activeSubscribersCount,
        arpu: activeSubscribersCount > 0 ? (mrr / activeSubscribersCount) : 0
      },
      history,
      recentTransactions
    };
  } catch (error: any) {
    console.error("[FinanceActionError]", error.message);
    return { success: false, error: error.message };
  }
}
