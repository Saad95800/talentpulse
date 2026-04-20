import { NextRequest, NextResponse } from "next/server";
import { processPaymentSuccess } from "@/lib/payment-logic";

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

    console.log(`📡 [MollieWebhook] Notification reçue pour le paiement ${id}`);

    // Appel de la logique partagée (Idempotente)
    const result = await processPaymentSuccess(id);

    if (result.success) {
      return new NextResponse("OK", { status: 200 });
    } else {
      // Si c'est un statut non payé (expiré, échoué), Mollie peut quand même envoyer un webhook
      return new NextResponse("Handled", { status: 200 });
    }

  } catch (error) {
    console.error("🔥 [MollieWebhook] Erreur critique:", error);
    return new NextResponse("Webhook Error", { status: 500 });
  }
}
