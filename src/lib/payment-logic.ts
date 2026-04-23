import * as Sentry from "@sentry/nextjs";
import { mollieClient } from "./mollie";
import prisma from "./prisma";
import { sendBillingSuccessEmail, sendBillingFailureEmail } from "./mail";

/**
 * Logique partagée pour traiter un succès de paiement Mollie.
 */
export async function processPaymentSuccess(params: { paymentId?: string; userId?: string }) {
  let { paymentId } = params;
  const { userId } = params;
  console.log(`[PaymentLogic] Début du traitement Mollie. Params:`, params);

  if ((!paymentId || paymentId === "{id}") && userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.mollieCustomerId) {
      try {
        const payments = await mollieClient.customerPayments.page({ customerId: user.mollieCustomerId });
        if (payments && payments.length > 0) {
          paymentId = payments[0].id;
        }
      } catch (err) {
        Sentry.captureException(err, { tags: { payment_flow: "recovery" }, extra: { userId } });
      }
    }
  }

  if (!paymentId || paymentId === "{id}") {
    return { success: false, error: "Identifiant de paiement introuvable." };
  }

  // 1. Récupérer le paiement chez Mollie
  const payment = await mollieClient.payments.get(paymentId);
  if (payment.status !== 'paid') return { success: false, error: "Paiement non confirmé" };

  // 2. Vérifier si déjà traité
  const existingRecord = await prisma.molliePayment.findUnique({
    where: { molliePaymentId: paymentId }
  });
  if (existingRecord) return { success: true, alreadyProcessed: true };

  const metadata = payment.metadata as { userId?: string; type?: string; email?: string; couponCode?: string };
  const effectiveUserId = metadata?.userId || userId;

  if (!effectiveUserId) throw new Error(`Aucun userId pour le paiement ${paymentId}`);

  // 3. Activer l'utilisateur
  const user = await prisma.user.findUnique({ where: { id: effectiveUserId } });
  if (!user) throw new Error(`Utilisateur introuvable pour le paiement ${paymentId}`);

  await finalizeSubscriptionUpgrade({
    userId: effectiveUserId,
    provider: 'mollie',
    subscriptionId: payment.subscriptionId || user.mollieSubscriptionId || undefined,
    couponCode: metadata.couponCode
  });

  // 4. Enregistrer la transaction
  const receiptNumber = await generateReceiptNumber('mollie');
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

  // 5. Email
  await sendBillingSuccessEmail(user.email, payment.amount.value, receiptNumber);

  return { success: true, processed: true };
}

/**
 * Logique universelle pour finaliser un passage au Premium.
 */
export async function finalizeSubscriptionUpgrade(params: { 
  userId: string; 
  provider: 'mollie' | 'stripe'; 
  subscriptionId?: string;
  amount?: number;
  couponCode?: string;
}) {
  const { userId, provider, subscriptionId } = params;

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: "PREMIUM",
      subscriptionStatus: "active",
      ...(provider === 'mollie' ? { mollieSubscriptionId: subscriptionId } : { stripeSubscriptionId: subscriptionId }),
      credits: 100,
      nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      gracePeriodStartedAt: null,
      lastBillingEmailSentAt: null,
    }
  });

  console.log(`[PaymentLogic] Plan Premium activé/renouvelé pour l'utilisateur ${userId} via ${provider}`);
}

/**
 * Génère un numéro de reçu unique.
 */
async function generateReceiptNumber(provider: 'mollie' | 'stripe') {
  const currentYear = new Date().getFullYear();
  let lastPayment;
  
  if (provider === 'mollie') {
    lastPayment = await prisma.molliePayment.findFirst({
      where: { receiptNumber: { contains: `RECU-${currentYear}` } },
      orderBy: { createdAt: 'desc' }
    });
  } else {
    lastPayment = await prisma.stripePayment.findFirst({
      where: { receiptNumber: { contains: `RECU-${currentYear}` } },
      orderBy: { createdAt: 'desc' }
    });
  }

  let nextId = 1;
  if (lastPayment) {
    const parts = lastPayment.receiptNumber.split('-');
    nextId = parseInt(parts[parts.length - 1]) + 1;
  }
  
  return `RECU-${currentYear}-${nextId.toString().padStart(4, '0')}`;
}

/**
 * Logique pour traiter un succès de paiement Stripe.
 */
export async function processStripePaymentSuccess(params: { 
  sessionId: string; 
  userId?: string;
  subscriptionId?: string;
  amountTotal?: number | null;
  currency?: string | null;
  customerId?: string | null;
}) {
  const { sessionId, userId, subscriptionId, amountTotal, currency, customerId } = params;
  console.log(`[PaymentLogic] Traitement succès Stripe pour l'utilisateur ${userId}`);

  if (!userId) throw new Error("userId manquant pour le succès Stripe");

  // 1. Vérifier si déjà traité
  const existingRecord = await prisma.stripePayment.findUnique({
    where: { stripePaymentId: sessionId }
  });
  if (existingRecord) return { success: true, alreadyProcessed: true };

  // 2. Activer l'abonnement
  await finalizeSubscriptionUpgrade({
    userId,
    provider: 'stripe',
    subscriptionId
  });

  // 3. Enregistrer la transaction
  const receiptNumber = await generateReceiptNumber('stripe');
  await prisma.stripePayment.create({
    data: {
      userId,
      amount: (amountTotal || 0) / 100, // Stripe est en centimes
      currency: currency?.toUpperCase() || "EUR",
      stripePaymentId: sessionId,
      method: "card",
      status: "paid",
      receiptNumber,
    }
  });

  // 4. Client ID si besoin
  if (customerId) {
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId }
    });
  }

  return { success: true };
}

/**
 * Logique pour traiter un échec de paiement Mollie.
 */
export async function processPaymentFailure(paymentId: string) {
  try {
    const payment = await mollieClient.payments.get(paymentId);
    const metadata = payment.metadata as { userId?: string };
    const userId = metadata?.userId;
    if (!userId) return { success: false, error: "Pas de userId" };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.plan === "PREMIUM" && !user.gracePeriodStartedAt) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          gracePeriodStartedAt: new Date(),
          subscriptionStatus: "past_due",
          lastBillingEmailSentAt: new Date()
        }
      });
      await sendBillingFailureEmail(user.email, 1);
    }
    return { success: true };
  } catch (error) {
    Sentry.captureException(error);
    return { success: false, error: "Internal error" };
  }
}
