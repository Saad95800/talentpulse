import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { processPaymentSuccess, processPaymentFailure } from "@/lib/payment-logic";
import { mollieClient } from "@/lib/mollie";

/**
 * Webhook Mollie : gère les notifications de succès/échec de paiement.
 * POST /api/webhooks/mollie
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const id = formData.get("id") as string;

    if (!id) {
      Sentry.captureMessage("[MollieWebhook] ID manquant dans la notification", "warning");
      return new NextResponse("ID manquant", { status: 400 });
    }

    console.log(`📡 [MollieWebhook] Notification reçue pour le paiement ${id}`);

    // 1. Récupérer le statut réel chez Mollie
    const payment = await mollieClient.payments.get(id);

    if (payment.status === 'paid') {
      const result = await processPaymentSuccess({ paymentId: id });
      if (result.success) return new NextResponse("OK", { status: 200 });
    } else if (['failed', 'expired', 'canceled'].includes(payment.status)) {
      const result = await processPaymentFailure(id);
      if (result.success) return new NextResponse("OK (Failure Handled)", { status: 200 });
    }

    return new NextResponse("Status ignored or Handled", { status: 200 });

  } catch (error) {
    Sentry.captureException(error, { tags: { webhook: "mollie" } });
    console.error("🔥 [MollieWebhook] Erreur critique:", error);
    return new NextResponse("Webhook Error", { status: 500 });
  }
}
