"use server";

import prisma from "@/lib/prisma";
import { deductCredit, checkCredits } from "./credits.action";
import { extractTextFromFile } from "@/lib/document";
import { generateMatchingScore } from "@/lib/ai";

/**
 * Chef d'Orchestre : Vérification crédit -> Extraction texte -> IA -> Sauvegarde DB -> Déduction crédit.
 * Reçoit un FormData contenant : userId, jobFile/jobTextRaw, cvFile/cvTextRaw.
 */
export async function processMatchingWorkflow(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const jobFile = formData.get('jobFile') as File | null;
    const cvFile = formData.get('cvFile') as File | null;
    const jobTextRaw = formData.get('jobTextRaw') as string | null;
    const cvTextRaw = formData.get('cvTextRaw') as string | null;

    // Étape A : Validation des inputs
    if (!userId) {
      return { success: false, error: "ID Utilisateur manquant." };
    }

    if (!jobFile && (!jobTextRaw || jobTextRaw.trim().length === 0)) {
       return { success: false, error: "Vous devez fournir une fiche de poste (fichier ou texte)." };
    }

    if (!cvFile && (!cvTextRaw || cvTextRaw.trim().length === 0)) {
       return { success: false, error: "Vous devez fournir un CV (fichier ou texte)." };
    }

    // Étape B : Vérification préalable des crédits
    const creditCheck = await checkCredits(userId);
    if (!creditCheck.success) {
      return { success: false, error: creditCheck.error }; 
    }

    // Étape C & D : Extraction du texte (Fichier ou Saisie directe)
    let jobText = "";
    let jobTitle = "Texte Saisi";
    
    if (jobFile && jobFile.size > 0) {
      const jobBuffer = Buffer.from(await jobFile.arrayBuffer());
      jobText = await extractTextFromFile(jobBuffer, jobFile.name);
      jobTitle = jobFile.name.replace(/\.[^/.]+$/, ""); // Retire l'extension
    } else if (jobTextRaw) {
      jobText = jobTextRaw;
    }

    let cvText = "";
    let candidateName = "Candidat Anonyme (Texte)";

    if (cvFile && cvFile.size > 0) {
      const cvBuffer = Buffer.from(await cvFile.arrayBuffer());
      cvText = await extractTextFromFile(cvBuffer, cvFile.name);
      candidateName = cvFile.name.replace(/\.[^/.]+$/, ""); // Retire l'extension
    } else if (cvTextRaw) {
      cvText = cvTextRaw;
    }

    // Vérification post-extraction
    if (jobText.trim().length < 50 || cvText.trim().length < 50) {
       return { 
         success: false, 
         error: "Le texte extrait est trop court pour effectuer une analyse pertinente. Vérifiez vos documents." 
       };
    }

    // Étape E : Le Cerveau IA
    const resultIA = await generateMatchingScore(jobText, cvText);

    // Étape F : Sauvegarde BDD
    const newRecord = await prisma.matchRecord.create({
      data: {
        userId,
        jobTitle,
        candidateName,
        score: resultIA.score,
        aiResponse: resultIA as any,
      },
    });

    // Étape G : L'analyse a réussi, on déduit le crédit !
    const deductResult = await deductCredit(userId);

    // Retour au Front-end
    return { 
      success: true, 
      data: resultIA, 
      recordId: newRecord.id,
      creditsRemaining: deductResult.success ? deductResult.creditsRemaining : creditCheck.currentCredits 
    };

  } catch (error: any) {
    console.error("Erreur Workflow Matching:", error);
    return { 
      success: false, 
      error: error.message || "Une erreur est survenue lors de l'analyse du profil." 
    };
  }
}
