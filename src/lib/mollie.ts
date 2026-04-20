import { createMollieClient, SequenceType } from '@mollie/api-client';

/**
 * Client Mollie initialisé avec la clé API test/live.
 * Nous utilisons le SDK officiel pour gérer les abonnements natifs.
 */
export const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY as string,
});

/**
 * Crée un client Mollie pour un utilisateur donné s'il n'en a pas déjà un.
 * Nécessaire avant d'initier un premier paiement d'abonnement.
 */
export async function getOrCreateMollieCustomer(userId: string, name: string, email: string) {
  const prisma = (await import('@/lib/prisma')).default;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mollieCustomerId: true }
  });

  if (user?.mollieCustomerId) {
    return user.mollieCustomerId;
  }

  const customer = await mollieClient.customers.create({
    name,
    email,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { mollieCustomerId: customer.id }
  });

  return customer.id;
}

/**
 * Initie un premier paiement (mandat) pour l'abonnement Premium.
 * Une fois payé, Mollie nous renverra un webhook pour créer la Subscription réelle.
 */
export async function createFirstSubscriptionPayment(customerId: string, userId: string, email: string, options?: { amount?: string; couponCode?: string }) {
  const webhookUrl = process.env.MOLLIE_WEBHOOK_URL;
  const isLocalhost = webhookUrl?.includes('localhost') || webhookUrl?.includes('127.0.0.1');

  if (isLocalhost) {
    console.warn("⚠️ [Mollie] L'URL de webhook contient 'localhost'. Elle sera ignorée pour permettre l'initialisation du paiement en local.");
  }

  const checkout = await mollieClient.payments.create({
    amount: {
      currency: 'EUR',
      value: options?.amount || '39.90', // Prix de l'abonnement Premium (ou prix réduit)
    },
    description: 'Abonnement TalentPulse Premium (1er mois)',
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?paymentId={id}&userId=${userId}`,
    webhookUrl: isLocalhost ? undefined : webhookUrl,
    metadata: {
      userId,
      email,
      type: 'FIRST_PAYMENT',
      couponCode: options?.couponCode // On transmet le coupon pour le Webhook
    },
    customerId,
    sequenceType: SequenceType.first, // Indique que c'est le paiement de mandat
  });

  return checkout.getCheckoutUrl();
}
