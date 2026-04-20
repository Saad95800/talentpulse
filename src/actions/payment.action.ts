"use server";

import prisma from "@/lib/prisma";
import { getOrCreateMollieCustomer, createFirstSubscriptionPayment, mollieClient } from "@/lib/mollie";
import { processPaymentSuccess } from "@/lib/payment-logic";

/**
 * Génère une URL de paiement Mollie Checkout pour s'abonner au plan Premium.
 * L'abonnement est à 39,90€/mois et donne 100 crédits.
 * Mollie nécessite un premier paiement pour valider le mandat de prélèvement.
 */
export async function getPremiumCheckoutUrlAction(userId: string) {
  if (!userId) return { success: false, error: "Utilisateur non authentifié." };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, mollieCustomerId: true }
    });

    if (!user) return { success: false, error: "Utilisateur introuvable." };

    // 1. S'assurer que le client Mollie existe
    const customerId = await getOrCreateMollieCustomer(userId, user.name || "Client", user.email);

    // 2. Créer le paiement de premier mandat
    const checkoutUrl = await createFirstSubscriptionPayment(customerId, userId, user.email);

    if (!checkoutUrl) {
      throw new Error("Mollie n'a pas renvoyé d'URL de paiement.");
    }

    return { 
      success: true, 
      url: checkoutUrl 
    };

  } catch (error) {
    console.error("❌ [PaymentAction] Erreur checkout Mollie:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return { 
      success: false, 
      error: `Impossible d'initialiser le paiement : ${errorMessage}` 
    };
  }
}

/**
 * Action de synchronisation manuelle déclenchée au retour sur le site (Success Page)
 */
export async function syncPaymentStatusAction(paymentId?: string, userId?: string) {
  try {
    const result = await processPaymentSuccess({ paymentId, userId });
    return result;
  } catch (error) {
    console.error("❌ [PaymentAction] Erreur sync Mollie:", error);
    return { success: false, error: "Erreur lors de la synchronisation du paiement." };
  }
}

/**
 * Annule l'abonnement Premium d'un utilisateur chez Mollie.
 */
export async function cancelSubscriptionAction(userId: string) {
  if (!userId) return { success: false, error: "Identifiant manquant." };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mollieSubscriptionId: true, mollieCustomerId: true }
    });

    if (!user || (!user.mollieSubscriptionId && !user.mollieCustomerId)) {
       // Si pas d'ID Mollie, on annule juste en local
       await prisma.user.update({
         where: { id: userId },
         data: { subscriptionStatus: "canceled" }
       });
       return { success: true, message: "Abonnement annulé." };
    }

    // Si on a un ID d'abonnement, on l'annule chez Mollie
    if (user.mollieSubscriptionId && user.mollieCustomerId) {
      await mollieClient.customerSubscriptions.cancel(user.mollieSubscriptionId, {
        customerId: user.mollieCustomerId
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "canceled",
        mollieSubscriptionId: null,
      }
    });

    return { 
      success: true, 
      message: "Abonnement annulé avec succès chez Mollie." 
    };
  } catch (error) {
    console.error("❌ [PaymentAction] Erreur annulation Mollie:", error);
    return { success: false, error: "Erreur lors de l'annulation de l'abonnement." };
  }
}

/**
 * Récupère l'historique des paiements d'un utilisateur (Mollie)
 */
export async function getPaymentHistoryAction(userId: string) {
  if (!userId) return [];

  try {
    return await prisma.molliePayment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  } catch {
    return [];
  }
}
