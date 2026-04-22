"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Récupère le processeur de paiement actif.
 */
export async function getActivePaymentProviderAction() {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { key: "payment_provider" }
    });
    return setting?.value || "mollie";
  } catch (error) {
    console.error("Error fetching payment provider:", error);
    return "mollie";
  }
}

/**
 * Définit le processeur de paiement actif.
 */
export async function setActivePaymentProviderAction(provider: "mollie" | "stripe") {
  try {
    await prisma.appSettings.upsert({
      where: { key: "payment_provider" },
      update: { value: provider },
      create: { key: "payment_provider", value: provider }
    });
    
    revalidatePath("/admin-talent-scraper/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error updating payment provider:", error);
    return { success: false, error: "Erreur lors de la mise à jour." };
  }
}
