"use server";

import prisma from "@/lib/prisma";
import { deductCredit } from "./credits.action";
import { extractTextFromPDF } from "@/lib/pdf";
import { generateMatchingScore } from "@/lib/ai";

/**
 * Workflow complet : Déduction crédit -> Extraction texte -> IA -> Sauvegarde DB.
 */
export async function processMatchingWorkflow(
  userId: string,
  jobBuffer: Buffer,
  cvBuffer: Buffer,
  jobTitle: string,
  candidateName: string
) {
  try {
    // 1. Déduction du crédit
    const creditResult = await deductCredit(userId);
    if (!creditResult.success) {
      return { success: false, error: creditResult.error };
    }

    // 2. Extraction du texte des PDF
    const jobText = await extractTextFromPDF(jobBuffer);
    const cvText = await extractTextFromPDF(cvBuffer);

    // 3. Appel de l'IA pour le matching
    const analysis = await generateMatchingScore(jobText, cvText);

    // 4. Sauvegarde en base de données
    const record = await prisma.matchRecord.create({
      data: {
        userId,
        jobTitle,
        candidateName,
        score: analysis.score,
        aiResponse: analysis as any, // On stocke l'objet JSON complet
      },
    });

    return {
      success: true,
      data: record,
      creditsRemaining: creditResult.creditsRemaining
    };

  } catch (error: any) {
    console.error("Erreur Workflow Matching:", error);
    return { 
      success: false, 
      error: error.message || "Une erreur est survenue lors du processing." 
    };
  }
}
