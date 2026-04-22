import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { processStripePaymentSuccess } from "@/lib/payment-logic";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error(`❌ [Stripe Webhook] Erreur de signature: ${err.message}`);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Événement reçu: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const metadata = session.metadata;

        if (session.payment_status === "paid") {
          await processStripePaymentSuccess({
            sessionId: session.id,
            userId: metadata.userId,
            subscriptionId: session.subscription as string,
            amountTotal: session.amount_total,
            currency: session.currency,
            customerId: session.customer as string
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        // Si c'est un paiement récurrent (pas le premier qui est géré par checkout.session.completed)
        if (invoice.billing_reason === "subscription_cycle") {
          const subscriptionId = invoice.subscription as string;
          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = stripeSubscription.metadata.userId;

          if (userId) {
            await processStripePaymentSuccess({
              sessionId: invoice.payment_intent as string, // On utilise l'ID du paiement
              userId,
              subscriptionId,
              amountTotal: invoice.amount_paid,
              currency: invoice.currency,
              customerId: invoice.customer as string
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const userId = subscription.metadata.userId;
        if (userId) {
          const prisma = (await import("@/lib/prisma")).default;
          await prisma.user.update({
            where: { id: userId },
            data: { subscriptionStatus: "canceled" }
          });
          console.log(`[Stripe Webhook] Abonnement annulé pour l'utilisateur ${userId}`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Événement non géré: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    Sentry.captureException(error);
    console.error(`[Stripe Webhook] Erreur lors du traitement:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
