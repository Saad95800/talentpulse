import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendBillingFailureEmail } from "@/lib/mail";

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
    const now = new Date();

    // 1. GESTION DE LA PÉRIODE DE GRÂCE (Règle des 3 jours)
    const activeGracePeriods = await prisma.user.findMany({
      where: {
        gracePeriodStartedAt: { not: null },
        plan: "PREMIUM"
      }
    });

    console.log(`[Cron:Billing] ${activeGracePeriods.length} utilisateurs en période de grâce.`);

    for (const user of activeGracePeriods) {
      const startTime = user.gracePeriodStartedAt!.getTime();
      const elapsedMs = now.getTime() - startTime;
      const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

      if (elapsedDays >= 3) {
        // EXCEPTION : Trop tard (plus de 3 jours révolus), on rétrograde
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: "FREE",
            subscriptionStatus: "suspended",
            gracePeriodStartedAt: null,
            lastBillingEmailSentAt: null,
            credits: 3 // Retour au quota gratuit
          }
        });
        
        // Email final de suspension (Tentative 3 ou +)
        await sendBillingFailureEmail(user.email, 3);
        console.log(`[Cron:Billing] 🛑 Suspension finale pour ${user.email} (Délai dépassé)`);
      } else {
        // PÉRIODE DE GRÂCE EN COURS : Relance quotidienne
        const lastSentMs = user.lastBillingEmailSentAt?.getTime() || 0;
        const msSinceLastEmail = now.getTime() - lastSentMs;

        // Si dernier email envoyé il y a plus de 23h, on relance
        if (msSinceLastEmail > 23 * 60 * 60 * 1000) {
          const nextAttempt = elapsedDays + 1; // Jour 1, 2 ou 3
          await sendBillingFailureEmail(user.email, nextAttempt);
          
          await prisma.user.update({
            where: { id: user.id },
            data: { lastBillingEmailSentAt: now }
          });
          console.log(`[Cron:Billing] 📧 Relance J+${elapsedDays} envoyée à ${user.email}`);
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      processedGracePeriods: activeGracePeriods.length
    });

  } catch (error) {
    console.error("❌ [Cron:Maintenance] Erreur globale:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
