import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import PaymentReceipt from "@/components/pdf/PaymentReceipt";
import React from "react";

/**
 * Route dynamique pour générer et télécharger un reçu de paiement PDF
 * GET /api/receipts/[paymentId]
 */
export const dynamic = "force-dynamic";

/**
 * Route dynamique pour générer et télécharger un reçu de paiement PDF
 * GET /api/receipts/[paymentId]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    console.log(`📄 [ReceiptAPI] Generating receipt for paymentId: ${paymentId}`);

    // 1. Récupérer le paiement et les infos utilisateur
    const payment = await prisma.molliePayment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    if (!payment) {
      console.warn(`⚠️ [ReceiptAPI] Payment not found: ${paymentId}`);
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    const planName = 'Abonnement Premium';

    // 2. Import dynamique de @react-pdf/renderer pour éviter les erreurs de bundler (Turbopack)
    // On récupère renderToBuffer avec un fallback si nécessaire
    const ReactPDF = await import("@react-pdf/renderer");
    const renderFn = ReactPDF.renderToBuffer || (ReactPDF as any).default?.renderToBuffer;

    if (typeof renderFn !== 'function') {
      console.error("❌ [ReceiptAPI] renderToBuffer is not a function. Keys found:", Object.keys(ReactPDF));
      throw new Error("Le module PDF n'a pas été chargé correctement.");
    }

    // 3. Générer le PDF
    const pdfBuffer = await renderFn(
      <PaymentReceipt 
        receiptNumber={payment.receiptNumber}
        date={payment.createdAt.toLocaleDateString('fr-FR')}
        customerName={payment.user.name || "Client"}
        customerEmail={payment.user.email}
        amount={payment.amount}
        planName={planName}
      />
    );

    console.log(`✅ [ReceiptAPI] PDF Generated successfully (${pdfBuffer.length} bytes)`);

    // 3. Retourner le flux PDF avec les bons headers
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=recu-${payment.receiptNumber}.pdf`,
        "Cache-Control": "no-store, max-age=0",
      },
    });

  } catch (error: any) {
    console.error("❌ [ReceiptAPI] CRITICAL ERROR:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la génération du reçu.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
