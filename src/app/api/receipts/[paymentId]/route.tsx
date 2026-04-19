import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ReactPDF from "@react-pdf/renderer";
import PaymentReceipt from "@/components/pdf/PaymentReceipt";
import React from "react";

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
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    // 2. Générer le PDF en mémoire
    // On utilise as any ici car les types de @react-pdf/renderer peuvent être stricts 
    // sur l'élément racine (Document), mais fonctionnellement c'est correct.
    const pdfStream = await ReactPDF.renderToBuffer(
      <PaymentReceipt 
        receiptNumber={payment.receiptNumber}
        date={payment.createdAt.toLocaleDateString('fr-FR')}
        customerName={payment.user.name || "Client"}
        customerEmail={payment.user.email}
        amount={payment.amount}
        planName="Abonnement Premium"
      /> as React.ReactElement<any>
    );

    // 3. Retourner le flux PDF avec les bons headers
    return new NextResponse(new Uint8Array(pdfStream), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=recu-${payment.receiptNumber}.pdf`,
      },
    });

  } catch (error) {
    console.error("❌ [ReceiptAPI] Erreur génération PDF:", error);
    return NextResponse.json({ error: "Erreur lors de la génération du reçu." }, { status: 500 });
  }
}
