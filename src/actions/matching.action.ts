"use server";

import prisma from "@/lib/prisma";
import { deductCredit } from "./credits.action";
import { extractTextFromPDF } from "@/lib/pdf";
import { generateMatchingScore } from "@/lib/ai";

/**
 * Chef d'Orchestre : Déduction crédit -> Extraction texte -> IA -> Sauvegarde DB.
 * Reçoit un FormData contenant : userId, jobFile, cvFile.
 */
export async function processMatchingWorkflow(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const jobFile = formData.get('jobFile') as File | null;
    const cvFile = formData.get('cvFile') as File | null;

    // Étape A : Validation des inputs
    if (!userId || !jobFile || !cvFile) {
      return { success: false, error: "Tous les champs sont obligatoires (User ID, Fiche de Poste, CV)." };
    }

    // Étape B : Paiement / Paywall
    const creditResult = await deductCredit(userId);
    if (!creditResult.success) {
      return { success: false, error: creditResult.error }; // "Crédits épuisés" servira au Front-end
    }

    // Étape C : Préparation des Buffers
    const jobBuffer = Buffer.from(await jobFile.arrayBuffer());
    const cvBuffer = Buffer.from(await cvFile.arrayBuffer());

    // Étape D : Extraction du texte
    const jobText = await extractTextFromPDF(jobBuffer);
    const cvText = await extractTextFromPDF(cvBuffer);

    // Étape E : Le Cerveau IA
    const resultIA = await generateMatchingScore(jobText, cvText);

    // Étape F : Sauvegarde BDD
    const jobTitle = jobFile.name.replace('.pdf', '');
    const candidateName = cvFile.name.replace('.pdf', '');

    const newRecord = await prisma.matchRecord.create({
      data: {
        userId,
        jobTitle,
        candidateName,
        score: resultIA.score,
        aiResponse: resultIA as any,
      },
    });

    // Retour au Front-end
    return { 
      success: true, 
      data: resultIA, 
      recordId: newRecord.id,
      creditsRemaining: creditResult.creditsRemaining 
    };

  } catch (error: any) {
    console.error("Erreur Workflow Matching:", error);
    return { 
      success: false, 
      error: "Une erreur est survenue lors de l'analyse du profil." 
    };
  }
}
