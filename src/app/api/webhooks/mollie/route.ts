import { NextRequest, NextResponse } from "next/server";
import { mollieClient } from "@/lib/mollie";
import prisma from "@/lib/prisma";
import { sendBillingSuccessEmail } from "@/lib/mail";

/**
 * Webhook Mollie : gère les notifications de succès/échec de paiement.
 * POST /api/webhooks/mollie
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const id = formData.get("id") as string;

    if (!id) {
      return new NextResponse("ID manquant", { status: 400 });
    }

    // 1. Récupérer le statut du paiement chez Mollie
    const payment = await mollieClient.payments.get(id);
    const metadata = payment.metadata as any;
    const userId = metadata?.userId;

    if (!userId) {
      console.warn(`⚠️ [MollieWebhook] Paiement ${id} sans userId associé.`);
      return new NextResponse("Outils internes", { status: 200 });
    }

    // 2. Traiter le succès du paiement
    if (payment.status === "paid") {
      console.log(`✅ [MollieWebhook] Paiement réussi pour l'utilisateur ${userId}`);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) return new NextResponse("User not found", { status: 404 });

      // CAS A : Premier paiement (Prélèvement de mandat) -> Créer l'abonnement
      if (metadata?.type === "FIRST_PAYMENT") {
        
        // Créer l'abonnement récurrent de 49.99€ / mois
        const subscription = await mollieClient.customerSubscriptions.create({
          customerId: user.mollieCustomerId as string,
          amount: {
            currency: 'EUR',
            value: '39.90',
          },
          interval: '1 month',
          description: 'Abonnement TalentPulse Premium (Récurrent)',
          webhookUrl: process.env.MOLLIE_WEBHOOK_URL,
        });

        // Activer le plan Premium et stocker l'ID d'abonnement
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "PREMIUM",
            subscriptionStatus: "active",
            mollieSubscriptionId: subscription.id,
            credits: 100, // Dotation initiale
            nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          }
        });

        console.log(`✨ [MollieWebhook] Abonnement récurrent créé : ${subscription.id}`);
      } 
      // CAS B : Paiement récurrent (automatique par Mollie)
      else {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "PREMIUM",
            subscriptionStatus: "active",
            credits: 100, // Réinitialisation mensuelle (perte des anciens crédits)
            nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          }
        });
        console.log(`🔄 [MollieWebhook] Crédits réinitialisés pour l'utilisateur ${userId}`);
      }

      // 3. Enregistrer la transaction et générer un numéro de reçu
      const lastPayment = await prisma.molliePayment.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      
      let nextId = 1;
      if (lastPayment && lastPayment.receiptNumber.includes(new Date().getFullYear().toString())) {
        const parts = lastPayment.receiptNumber.split('-');
        nextId = parseInt(parts[parts.length - 1]) + 1;
      }
      
      const receiptNumber = `RECU-${new Date().getFullYear()}-${nextId.toString().padStart(4, '0')}`;

      await prisma.molliePayment.create({
        data: {
          userId,
          amount: parseFloat(payment.amount.value),
          currency: payment.amount.currency,
          molliePaymentId: payment.id,
          method: payment.method as string,
          status: "paid",
          receiptNumber,
        }
      });

      // 4. Notification par email via Brevo
      await sendBillingSuccessEmail(user.email, payment.amount.value, receiptNumber);
    }

    // Traiter l'échec
    if (payment.status === "failed" || payment.status === "expired") {
      console.error(`❌ [MollieWebhook] Paiement échoué ou expiré pour ${userId}`);
      // On peut ajouter ici une logique de downgrade ou de notification d'échec
    }

    return new NextResponse("OK", { status: 200 });

  } catch (error) {
    console.error("🔥 [MollieWebhook] Erreur critique:", error);
    return new NextResponse("Webhook Error", { status: 500 });
  }
}
