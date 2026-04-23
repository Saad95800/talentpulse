"use server";

import prisma from "@/lib/prisma";
import { getOrCreateMollieCustomer, createFirstSubscriptionPayment, mollieClient } from "@/lib/mollie";
import { getOrCreateStripeCustomer, createStripeCheckoutSession, stripe } from "@/lib/stripe";
import { processPaymentSuccess, processStripePaymentSuccess } from "@/lib/payment-logic";

/**
 * Récupère le processeur de paiement actif (Mollie par défaut).
 */
async function getActiveProvider() {
  const setting = await prisma.appSettings.findUnique({
    where: { key: "payment_provider" }
  });
  return setting?.value === "stripe" ? "stripe" : "mollie";
}

/**
 * Génère une URL de paiement (Mollie ou Stripe) pour s'abonner au plan Premium.
 */
export async function getPremiumCheckoutUrlAction(userId: string, couponCode?: string) {
  if (!userId) return { success: false, error: "Utilisateur non authentifié." };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, mollieCustomerId: true, stripeCustomerId: true }
    });

    if (!user) return { success: false, error: "Utilisateur introuvable." };

    const provider = await getActiveProvider();
    
    // Gestion du coupon
    let amount = 39.90;
    let finalCouponCode: string | undefined = undefined;

    if (couponCode) {
      console.log(`[Payment] Verification du coupon: ${couponCode}`);
      // Utilisation de findFirst au lieu de findUnique car isActive ne fait pas partie de l'index unique
      const dbCoupon = await prisma.coupon.findFirst({
        where: { 
          code: couponCode.trim().toUpperCase(), 
          isActive: true 
        }
      });

      if (dbCoupon) {
        console.log(`[Payment] Coupon trouve: ${dbCoupon.code}, type: ${dbCoupon.type}, value: ${dbCoupon.value}`);
        if (dbCoupon.type === "FIXED_PRICE") {
          amount = dbCoupon.value;
        } else if (dbCoupon.type === "DISCOUNT") {
          amount = Math.max(1.00, amount - dbCoupon.value); // Minimum 1€ pour Stripe/Mollie
        }
        finalCouponCode = dbCoupon.code;
      } else {
        console.warn(`[Payment] Coupon non trouve ou inactif: ${couponCode}`);
      }
    }

    console.log(`[Payment] Montant final calculate: ${amount.toFixed(2)}€ (${provider})`);

    if (provider === "stripe") {
      const customerId = await getOrCreateStripeCustomer(userId, user.name || "Client", user.email);
      const url = await createStripeCheckoutSession(customerId, userId, user.email, {
        amount: amount.toFixed(2),
        couponCode: finalCouponCode
      });
      return { success: true, url };
    } else {
      const customerId = await getOrCreateMollieCustomer(userId, user.name || "Client", user.email);
      const url = await createFirstSubscriptionPayment(customerId, userId, user.email, {
        amount: amount.toFixed(2),
        couponCode: finalCouponCode
      });
      return { success: true, url };
    }

  } catch (error) {
    console.error("❌ [PaymentAction] Erreur checkout:", error);
    return { success: false, error: "Impossible d'initialiser le paiement." };
  }
}

/**
 * Action de synchronisation (Success Page)
 */
export async function syncPaymentStatusAction(paymentId?: string, userId?: string, sessionId?: string) {
  try {
    if (sessionId) {
      // Cas Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        const res = await processStripePaymentSuccess({
          sessionId,
          userId,
          subscriptionId: session.subscription as string,
          amountTotal: session.amount_total,
          currency: session.currency,
          customerId: session.customer as string
        });
        return res;
      }
    } else {
      // Cas Mollie
      return await processPaymentSuccess({ paymentId, userId });
    }
    return { success: false, error: "Paiement non trouvé ou invalide" };
  } catch (error) {
    console.error("❌ [PaymentAction] Erreur sync:", error);
    return { success: false, error: "Erreur synchronisation." };
  }
}

/**
 * Annule l'abonnement Premium.
 */
export async function cancelSubscriptionAction(userId: string) {
  if (!userId) return { success: false, error: "Identifiant manquant." };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mollieSubscriptionId: true, mollieCustomerId: true, stripeSubscriptionId: true }
    });

    if (!user) return { success: false, error: "Utilisateur introuvable." };

    // Annulation Stripe
    if (user.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    }
    
    // Annulation Mollie
    if (user.mollieSubscriptionId && user.mollieCustomerId) {
      await mollieClient.customerSubscriptions.cancel(user.mollieSubscriptionId, {
        customerId: user.mollieCustomerId
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: "canceled" }
    });

    return { success: true, message: "Abonnement annulé." };
  } catch (error) {
    console.error("❌ [PaymentAction] Erreur annulation:", error);
    return { success: false, error: "Erreur lors de l'annulation." };
  }
}

/**
 * Récupère l'historique complet (Mollie + Stripe)
 */
export async function getPaymentHistoryAction(userId: string) {
  if (!userId) return [];
  try {
    const mPayments = await prisma.molliePayment.findMany({ where: { userId } });
    const sPayments = await prisma.stripePayment.findMany({ where: { userId } });
    
    return [...mPayments, ...sPayments].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}
