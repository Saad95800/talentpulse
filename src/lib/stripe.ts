import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing from .env");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia" as any,
});

/**
 * Récupère ou crée un client Stripe pour un utilisateur.
 */
export async function getOrCreateStripeCustomer(userId: string, name: string, email: string) {
  const prisma = (await import('@/lib/prisma')).default;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true }
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    name,
    email,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id }
  });

  return customer.id;
}

/**
 * Crée une session de Checkout Stripe pour l'abonnement Premium.
 */
export async function createStripeCheckoutSession(customerId: string, userId: string, email: string, options?: { amount?: string; couponCode?: string }) {
  const productId = process.env.STRIPE_PRODUCT_ID;
  if (!productId) throw new Error("STRIPE_PRODUCT_ID is missing");

  // Utilisation de price_data pour supporter les prix dynamiques (coupons)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product: productId,
          unit_amount: Math.round(parseFloat(options?.amount || "39.90") * 100),
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}&userId=${userId}&provider=stripe`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    metadata: {
      userId,
      email,
      type: 'FIRST_PAYMENT',
      couponCode: options?.couponCode || ""
    },
    subscription_data: {
      metadata: {
        userId,
        type: 'RECURRING_PAYMENT'
      }
    }
  });

  return session.url;
}

/**
 * Annule un abonnement Stripe.
 */
export async function cancelStripeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}
