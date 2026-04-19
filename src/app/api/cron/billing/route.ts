import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Route Cron pour la maintenance et synchronisation de la facturation
 * Avec Mollie Subscriptions, le prélèvement est automatique.
 * Ce script peut servir à vérifier les incohérences ou nettoyer les données.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🚀 [Cron:Maintenance] Début du cycle de maintenance facturation.");

    // EXEMPLE : Désactiver les accès Premium dont la date de validité est dépassée de plus de 3 jours 
    // (sécurité si le webhook d'échec de Mollie n'a pas fonctionné)
    const now = new Date();
    const gracePeriod = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const expiredUsers = await prisma.user.findMany({
      where: {
        plan: "PREMIUM",
        subscriptionStatus: "active",
        nextBillingDate: { lte: gracePeriod }
      }
    });

    for (const user of expiredUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: "FREE",
          subscriptionStatus: "suspended"
        }
      });
      console.log(`⚠️ [Cron:Maintenance] Suspension de sécurité pour ${user.email}`);
    }

    return NextResponse.json({ 
      success: true,
      processed: expiredUsers.length 
    });

  } catch (error) {
    console.error("❌ [Cron:Maintenance] Erreur globale:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
