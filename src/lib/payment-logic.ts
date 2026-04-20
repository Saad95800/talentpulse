import { mollieClient } from "./mollie";
import prisma from "./prisma";
import { sendBillingSuccessEmail } from "./mail";

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
          console.warn(`[PaymentLogic] Aucun paiement trouvé chez Mollie pour le client ${user.mollieCustomerId}`);
        }
      } catch (err) {
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

  const metadata = payment.metadata as { userId?: string; type?: string; email?: string };
  const effectiveUserId = metadata?.userId || userId;

  if (!effectiveUserId) {
    throw new Error(`Aucun userId trouvé pour le paiement ${paymentId}`);
  }

  // 3. Récupérer l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: effectiveUserId }
  });

  if (!user) {
    throw new Error(`Utilisateur ${effectiveUserId} introuvable pour le paiement ${paymentId}`);
  }

  // 4. Traiter selon le type de paiement
  if (metadata.type === 'FIRST_PAYMENT' && user.plan !== 'PREMIUM') {
    const isLocalhost = process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');
    const webhookUrl = process.env.MOLLIE_WEBHOOK_URL;

    // Créer l'abonnement récurrent chez Mollie
    const subscription = await mollieClient.customerSubscriptions.create({
      customerId: user.mollieCustomerId as string,
      amount: {
        currency: 'EUR',
        value: '39.90',
      },
      interval: '1 month',
      description: 'Abonnement TalentPulse Premium (Récurrent)',
      webhookUrl: isLocalhost ? undefined : webhookUrl,
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
    console.error("[PaymentLogic] Échec envoi email:", err);
  }

  return { success: true, processed: true };
}
