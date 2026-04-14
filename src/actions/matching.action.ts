"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { deductCredit, checkCredits } from "./credits.action";
import { extractTextFromFile } from "@/lib/document";
import { generateMatchingScore } from "@/lib/ai";
import { logError, logInfo } from "./logger.action";

/**
 * Chef d'Orchestre : Vérification crédit -> Extraction texte -> IA -> Sauvegarde DB -> Déduction crédit.
 * Reçoit un FormData contenant : userId, jobFile/jobTextRaw, cvFile/cvTextRaw.
 */
export async function processMatchingWorkflow(formData: FormData) {
  const startTime = Date.now();
  try {
    const userId = formData.get('userId') as string;
    console.log(`[Workflow] Début Matching pour ${userId} à ${new Date().toISOString()}`);
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
      console.log(`[Workflow] Extraction Job: ${jobFile.name} (${jobFile.size} bytes)`);
      const jobBuffer = Buffer.from(await jobFile.arrayBuffer());
      try {
        const jobDoc = await extractTextFromFile(jobBuffer, jobFile.name);
        jobText = jobDoc.text;
        jobTitle = jobFile.name.replace(/\.[^/.]+$/, "");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        console.error(`[Workflow] Échec extraction Job:`, err);
        return { success: false, error: `Erreur sur la fiche de poste : ${message}` };
      }
    } else if (jobTextRaw) {
      jobText = jobTextRaw;
    }

    let cvText = "";
    let candidateName = "Candidat Anonyme (Fichier)";
    let cvFileData: { buffer: Buffer, mimeType: string, isScanned: boolean } | undefined;

    if (cvFile && cvFile.size > 0) {
      console.log(`[Workflow] Extraction CV: ${cvFile.name} (${cvFile.size} bytes)`);
      const cvBuffer = Buffer.from(await cvFile.arrayBuffer());
      try {
        const cvDoc = await extractTextFromFile(cvBuffer, cvFile.name);
        cvText = cvDoc.text;
        candidateName = cvFile.name.replace(/\.[^/.]+$/, "");
        
        // On prépare les données pour l'IA (Multimodal / OCR)
        cvFileData = {
          buffer: cvBuffer,
          mimeType: cvDoc.mimeType || 'application/pdf',
          isScanned: cvDoc.isScanned
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        console.error(`[Workflow] Échec extraction CV:`, err);
        return { success: false, error: `Erreur sur le CV : ${message}` };
      }
    } else if (cvTextRaw) {
      cvText = cvTextRaw;
    }

    // Vérification post-extraction
    // Pour les scans, on autorise un texte court car l'IA fera l'OCR
    if (!cvFileData?.isScanned && (jobText.trim().length < 50 || cvText.trim().length < 50)) {
       return { 
         success: false, 
         error: "Le texte extrait est trop court pour effectuer une analyse pertinente. Vérifiez vos documents." 
       };
    }

    // Étape E : Le Cerveau IA
    const resultIA = await generateMatchingScore(jobText, cvText, cvFileData);

    // Étape F : Sauvegarde Structurelle BDD (Vivier IA)
    // Nous créons systématiquement les entités Mission et Candidate pour le Vivier.
    // DEBUG: Vérification de la présence des modèles dans Prisma
    if (!prisma.mission || !prisma.candidate) {
      const missing = [];
      if (!prisma.mission) missing.push("Mission");
      if (!prisma.candidate) missing.push("Candidate");
      console.error(`[Workflow] ERREUR CRITIQUE : Modèles manquants dans le client Prisma : ${missing.join(', ')}`);
      throw new Error(`Le système de base de données est en cours de mise à jour (${missing.join(', ')} manquants). Veuillez réessayer dans quelques instants.`);
    }

    const mission = await prisma.mission.create({
      data: {
        userId,
        title: jobTitle,
        description: jobText,
      }
    });

    const info = resultIA.candidateInfo || {};
    const candidate = await prisma.candidate.create({
      data: {
        userId,
        name: `${info.firstName || ''} ${info.lastName || ''}`.trim() || candidateName,
        firstName: info.firstName,
        lastName: info.lastName,
        email: info.email,
        phone: info.phone,
        address: info.address,
        linkedin: info.linkedin,
        website: info.website,
        summary: info.summary,
        languages: (info.languages || []) as any,
        skills: (info.skills || []) as any,
        experiences: (info.experiences || []) as any,
        educations: (info.educations || []) as any,
        cvText,
      }
    });

    const newRecord = await prisma.matchRecord.create({
      data: {
        userId,
        missionId: mission.id,
        candidateId: candidate.id,
        jobTitle,
        candidateName,
        score: resultIA.score,
        aiResponse: resultIA as unknown as Prisma.InputJsonValue,
      },
    });

    // Étape G : L'analyse a réussi, on déduit le crédit !
    const deductResult = await deductCredit(userId);

    // UX : On s'assure que le loader est resté visible au moins 1500ms pour ne pas "clignoter"
    const duration = Date.now() - startTime;
    if (duration < 1500) {
      await new Promise(r => setTimeout(r, 1500 - duration));
    }

    // Retour au Front-end
    await logInfo(`Matching réussi pour ${candidateName} sur ${jobTitle}`, userId, { 
      recordId: newRecord.id,
      missionId: mission.id,
      candidateId: candidate.id 
    });
    
    return { 
      success: true, 
      data: resultIA, 
      recordId: newRecord.id,
      creditsRemaining: deductResult.success ? (deductResult.creditsRemaining ?? 0) : (creditCheck.currentCredits ?? 0) 
    };

  } catch (error) {
    const userId = formData.get('userId') as string;
    const message = error instanceof Error ? error.message : "Une erreur est survenue lors de l'analyse du profil.";
    
    // Log dans la DB !
    await logError("Échec fatal du matching", error, userId, { 
      duration: Date.now() - startTime,
      jobTitle: formData.get('jobTitleRaw') 
    });

    console.error(`[Workflow] Erreur fatale critique (durée ${Date.now() - startTime}ms):`, {
      message,
      error: error instanceof Error ? { name: error.name, stack: error.stack } : error
    });
    
    return { 
      success: false, 
      error: message 
    };
  }
}
