"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateCandidateAction(candidateId: string, userId: string, data: any) {
  try {
    // Vérification de propriété
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate || candidate.userId !== userId) {
      return { success: false, error: "Non autorisé ou candidat introuvable." };
    }

    // Mise à jour
    const updated = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        linkedin: data.linkedin,
        website: data.website,
        summary: data.summary,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || candidate.name,
      }
    });

    revalidatePath('/vivier');
    return JSON.parse(JSON.stringify({ success: true, candidate: updated }));
  } catch (error) {
    console.error("Erreur updateCandidateAction:", error);
    return { success: false, error: "Erreur lors de la mise à jour des données." };
  }
}
