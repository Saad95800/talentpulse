import * as Sentry from "@sentry/nextjs";
import { mollieClient } from "./mollie";
import prisma from "./prisma";
import { sendBillingSuccessEmail, sendBillingFailureEmail } from "./mail";

/**
 * Logique partagée pour traiter un succès de paiement Mollie.
 * Utilisée par le Webhook ET par la page de succès (fallback).
 * Est idempotente (ne traite pas deux fois le même paiement).
 */
export async function processPaymentSuccess(params: { paymentId?: string; userId?: string }) {
  let { paymentId } = params;
  const { userId } = params;
  console.log(`[PaymentLogic] Début du traitement. Params:`, params);

  // Si pas de paymentId (ou s'il est resté textuel "{id}") mais qu'on a un userId, 
  // on cherche le dernier paiement de ce client pour synchroniser.
  if ((!paymentId || paymentId === "{id}") && userId) {
    console.log(`[PaymentLogic] Mode récupération : Recherche du dernier paiement pour l'utilisateur ${userId}`);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.mollieCustomerId) {
      try {
        const payments = await mollieClient.customerPayments.page({ customerId: user.mollieCustomerId });
        if (payments && payments.length > 0) {
          paymentId = payments[0].id;
          console.log(`[PaymentLogic] Dernier paiement identifié : ${paymentId}`);
        } else {
          Sentry.captureMessage(`Aucun paiement trouvé chez Mollie pour le client ${user.mollieCustomerId}`, "warning");
          console.warn(`[PaymentLogic] Aucun paiement trouvé chez Mollie pour le client ${user.mollieCustomerId}`);
        }
      } catch (err) {
        Sentry.captureException(err, { tags: { payment_flow: "recovery" }, extra: { userId } });
        console.error(`[PaymentLogic] Erreur lors de la liste des paiements Mollie:`, err);
      }
    }
  }

  if (!paymentId || paymentId === "{id}") {
    return { success: false, error: "Identifiant de paiement introuvable ou invalide." };
  }

  // 1. Récupérer le paiement chez Mollie
  const payment = await mollieClient.payments.get(paymentId);
  
  if (payment.status !== 'paid') {
    console.log(`[PaymentLogic] Le paiement ${paymentId} n'est pas encore payé (Statut: ${payment.status})`);
    return { success: false, error: "Paiement non confirmé" };
  }

  // 2. Vérifier si ce paiement a déjà été traité en base de données
  const existingRecord = await prisma.molliePayment.findUnique({
    where: { molliePaymentId: paymentId }
  });

  if (existingRecord) {
    console.log(`[PaymentLogic] Le paiement ${paymentId} a déjà été traité précédemment.`);
    return { success: true, alreadyProcessed: true };
  }

  const metadata = payment.metadata as { userId?: string; type?: string; email?: string; couponCode?: string };
  const effectiveUserId = metadata?.userId || userId;

  if (!effectiveUserId) {
    const err = new Error(`Aucun userId trouvé pour le paiement ${paymentId}`);
    Sentry.captureException(err, { extra: { paymentId, metadata: payment.metadata } });
    throw err;
  }

  // 3. Récupérer l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: effectiveUserId }
  });

  if (!user) {
    const err = new Error(`Utilisateur ${effectiveUserId} introuvable pour le paiement ${paymentId}`);
    Sentry.captureException(err, { extra: { effectiveUserId, paymentId } });
    throw err;
  }

  // 4. Traiter selon le type de paiement
  if (metadata.type === 'FIRST_PAYMENT' && user.plan !== 'PREMIUM') {
    const isLocalhost = process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');
    const webhookUrl = process.env.MOLLIE_WEBHOOK_URL;

    // Détermination du prix de l'abonnement récurrent
    let subscriptionPrice = "39.90";
    if (metadata.couponCode) {
      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: metadata.couponCode, isActive: true }
      });
      if (dbCoupon) {
        if (dbCoupon.type === "FIXED_PRICE") {
          subscriptionPrice = dbCoupon.value.toFixed(2);
        } else if (dbCoupon.type === "DISCOUNT") {
          subscriptionPrice = Math.max(0, 39.90 - dbCoupon.value).toFixed(2);
        }
      }
    }

    // Créer l'abonnement récurrent chez Mollie
    const subscription = await mollieClient.customerSubscriptions.create({
      customerId: user.mollieCustomerId as string,
      amount: {
        currency: 'EUR',
        value: subscriptionPrice,
      },
      interval: '1 month',
      description: `Abonnement TalentPulse Premium (Récurrent${metadata.couponCode ? ` - Coupon ${metadata.couponCode}` : ''})`,
      webhookUrl: isLocalhost ? undefined : webhookUrl,
      metadata: {
        userId: effectiveUserId,
        type: 'RECURRING_PAYMENT'
      }
    });

    // Activer le mode Premium
    await prisma.user.update({
      where: { id: effectiveUserId },
      data: {
        plan: "PREMIUM",
        subscriptionStatus: "active",
        mollieSubscriptionId: subscription.id,
        credits: 300, // Dotation Premium (Mise à jour à 300)
        nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        gracePeriodStartedAt: null,
        lastBillingEmailSentAt: null,
      }
    });

    console.log(`[PaymentLogic] Plan Premium activé pour ${user.email}`);
  } else {
    // Paiement récurrent ou déjà Premium (recharge de crédits)
    await prisma.user.update({
      where: { id: effectiveUserId },
      data: {
        plan: "PREMIUM",
        subscriptionStatus: "active",
        credits: 300,
        nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        gracePeriodStartedAt: null,
        lastBillingEmailSentAt: null,
      }
    });
    console.log(`[PaymentLogic] Crédits réinitialisés pour ${user.email}`);
  }

  // 5. Enregistrer la transaction (Génération du reçu)
  const lastPayment = await prisma.molliePayment.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  
  let nextId = 1;
  const currentYear = new Date().getFullYear();
  if (lastPayment && lastPayment.receiptNumber.includes(currentYear.toString())) {
    const parts = lastPayment.receiptNumber.split('-');
    nextId = parseInt(parts[parts.length - 1]) + 1;
  }
  
  const receiptNumber = `RECU-${currentYear}-${nextId.toString().padStart(4, '0')}`;

  await prisma.molliePayment.create({
    data: {
      userId: effectiveUserId,
      amount: parseFloat(payment.amount.value),
      currency: payment.amount.currency,
      molliePaymentId: payment.id,
      method: payment.method as string || 'card',
      status: "paid",
      receiptNumber,
    }
  });

  // 6. Envoyer l'email de confirmation
  try {
    await sendBillingSuccessEmail(user.email, payment.amount.value, receiptNumber);
    console.log(`[PaymentLogic] Email de confirmation envoyé à ${user.email}`);
  } catch (err) {
    Sentry.captureException(err, { tags: { service: "mail", context: "payment_success" }, extra: { userEmail: user.email, paymentId } });
    console.error("[PaymentLogic] Échec envoi email:", err);
  }

  return { success: true, processed: true };
}

/**
 * Logique pour traiter un échec de paiement Mollie.
 * Déclenchée par le Webhook.
 */
export async function processPaymentFailure(paymentId: string) {
  console.log(`[PaymentLogic] Traitement de l'échec pour le paiement ${paymentId}`);
  
  try {
    const payment = await mollieClient.payments.get(paymentId);
    const metadata = payment.metadata as { userId?: string; type?: string };
    const userId = metadata?.userId;

    if (!userId) {
      Sentry.captureMessage(`Échec de paiement ignoré : pas de userId dans les métadonnées (Paiement: ${paymentId})`, "warning");
      console.warn(`[PaymentLogic] Échec ignoré : pas de userId dans les métadonnées du paiement ${paymentId}`);
      return { success: false, error: "Pas de userId" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Utilisateur non trouvé" };

    // Si l'utilisateur est Premium et qu'un paiement échoue (probablement récurrent)
    if (user.plan === "PREMIUM") {
      // Si la période de grâce n'a pas encore commencé, on l'initialise
      if (!user.gracePeriodStartedAt) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            gracePeriodStartedAt: new Date(),
            subscriptionStatus: "past_due",
            lastBillingEmailSentAt: new Date()
          }
        });

        // Envoi du premier mail d'alerte (Jour 1 / Tentative 1)
        await sendBillingFailureEmail(user.email, 1);
        console.log(`[PaymentLogic] Début de la période de grâce pour ${user.email}`);
      }
    }

    return { success: true };
  } catch (error) {
    Sentry.captureException(error, { tags: { payment_flow: "failure_processing" }, extra: { paymentId } });
    console.error(`[PaymentLogic] Erreur lors du processPaymentFailure:`, error);
    return { success: false, error: "Internal error" };
  }
}
