"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { deductCredit, checkCredits } from "./credits.action";
import { extractTextFromFile } from "@/lib/document";
import { generateMatchingScore, extractCandidateInfo, validateDocumentConformity } from "@/lib/ai";
import { logError, logInfo } from "./logger.action";

/**
 * Chef d'Orchestre : Vérification crédit -> Extraction texte -> IA -> Sauvegarde DB -> Déduction crédit.
 * Reçoit un FormData contenant : userId, jobFile/jobTextRaw, cvFile/cvTextRaw.
 */
export async function processMatchingWorkflow(formData: FormData) {
  const startTime = Date.now();
  try {
    const userId = formData.get('userId') as string;
    const skipDeduction = formData.get('skipDeduction') === 'true';
    console.log(`[Workflow] Début Matching pour ${userId} à ${new Date().toISOString()} (skipDeduction: ${skipDeduction})`);
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
    
    // Validation de sécurité sur la taille (Max 10MB par fichier)
    if (jobFile && jobFile.size > 10 * 1024 * 1024) {
      return { success: false, error: `La fiche de poste "${jobFile.name}" dépasse la limite de 10 Mo.` };
    }
    if (cvFile && cvFile.size > 10 * 1024 * 1024) {
      return { success: false, error: `Le CV "${cvFile.name}" dépasse la limite de 10 Mo.` };
    }
    
    const totalSize = (jobFile?.size || 0) + (cvFile?.size || 0);
    if (totalSize > 15 * 1024 * 1024) { // On est un peu plus souple sur le cumul (15MB)
      return { success: false, error: "La taille cumulée des documents est trop importante (max 15 Mo au total)." };
    }

    if (jobFile && jobFile.size > 0) {
      console.log(`[Workflow] Extraction Job: ${jobFile.name} (${jobFile.size} bytes)`);
      const jobBuffer = Buffer.from(await jobFile.arrayBuffer());
      try {
        const jobDoc = await extractTextFromFile(jobBuffer, jobFile.name);
        jobText = jobDoc.text.substring(0, 30000); // TRUNCATION DE SÉCURITÉ
        jobTitle = jobFile.name.replace(/\.[^/.]+$/, "");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        console.error(`[Workflow] Échec extraction Job:`, err);
        return { success: false, error: `Erreur sur la fiche de poste : ${message}` };
      }
    } else if (jobTextRaw) {
      jobText = jobTextRaw.substring(0, 30000);
    }

    // Validation de conformité de la fiche de poste
    console.log("[Workflow] Validation conformité Job...");
    const jobFileData = jobFile ? {
       buffer: Buffer.from(await jobFile.arrayBuffer()),
       mimeType: jobFile.type || 'application/pdf',
       isScanned: false // On suppose que la JD n'est pas un scan par défaut, mais au besoin on peut affiner
    } : undefined;

    const jobValidation = await validateDocumentConformity(jobText, 'job', jobFileData);
    if (!jobValidation.isConform) {
      return { success: false, error: `La fiche de poste ne semble pas valide : ${jobValidation.reason}` };
    }

    let cvText = "";
    let candidateName = "Candidat Anonyme (Fichier)";
    let cvFileData: { buffer: Buffer, mimeType: string, isScanned: boolean } | undefined;

    if (cvFile && cvFile.size > 0) {
      console.log(`[Workflow] Extraction CV: ${cvFile.name} (${cvFile.size} bytes)`);
      const cvBuffer = Buffer.from(await cvFile.arrayBuffer());
      try {
        const cvDoc = await extractTextFromFile(cvBuffer, cvFile.name);
        cvText = cvDoc.text.substring(0, 30000); // TRUNCATION DE SÉCURITÉ
        candidateName = cvFile.name.replace(/\.[^/.]+$/, "");
        
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
      cvText = cvTextRaw.substring(0, 30000);
    }

    // Validation de conformité du CV
    console.log("[Workflow] Validation conformité CV...");
    const cvValidation = await validateDocumentConformity(cvText, 'cv', cvFileData);
    if (!cvValidation.isConform) {
      return { success: false, error: `Le document du candidat ne semble pas être un CV valide : ${cvValidation.reason}` };
    }

    // Étape E : Le Cerveau IA - Workflow Multi-Modèle Optimisé
    // 1. Extraction du profil (Fast Path - Gemini Flash)
    console.log("[Workflow] Étape 1: Extraction Profil...");
    const candidateInfo = await extractCandidateInfo(cvText, cvFileData);
    
    // 2. Analyse de Matching (Intelligence Path - Claude/Générique)
    console.log("[Workflow] Étape 2: Matching Sémantique...");
    const resultIA = await generateMatchingScore(jobText, cvText, candidateInfo);

    // Étape F : Sauvegarde Structurelle BDD (Vivier IA)
    if (!prisma.mission || !prisma.candidate) {
      throw new Error("Base de données indisponible.");
    }

    const finalCandidateName = `${candidateInfo.firstName || ''} ${candidateInfo.lastName || ''}`.trim() || candidateName;

    // Helper de troncation pour éviter les erreurs "too long" même après passage en TEXT (64kb)
    const truncate = (str: string | undefined | null, max: number) => 
      str ? str.substring(0, max) : str;

    const mission = await prisma.mission.create({
      data: {
        userId,
        title: truncate(jobTitle, 1000) || "Sans titre",
        description: jobText,
      }
    });

    const candidate = await prisma.candidate.create({
      data: {
        userId,
        name: truncate(finalCandidateName, 500) || "Candidat",
        firstName: truncate(candidateInfo.firstName, 200),
        lastName: truncate(candidateInfo.lastName, 200),
        email: truncate(candidateInfo.email, 200),
        phone: truncate(candidateInfo.phone, 200),
        address: truncate(candidateInfo.address, 500),
        linkedin: truncate(candidateInfo.linkedin, 500),
        website: truncate(candidateInfo.website, 500),
        summary: candidateInfo.summary, // Déjà LongText
        languages: (candidateInfo.languages || []) as Prisma.InputJsonValue,
        skills: (candidateInfo.skills || []) as Prisma.InputJsonValue,
        experiences: (candidateInfo.experiences || []) as Prisma.InputJsonValue,
        educations: (candidateInfo.educations || []) as Prisma.InputJsonValue,
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

    // Étape G : L'analyse a réussi, on déduit le crédit (sauf si mode batch/skip)
    let deductResult: { success: boolean; creditsRemaining?: number; error?: string } = { 
      success: true, 
      creditsRemaining: creditCheck.currentCredits as number 
    };
    if (!skipDeduction) {
      deductResult = await deductCredit(userId);
    }

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
    
    return JSON.parse(JSON.stringify({ 
      success: true, 
      data: {
        ...resultIA,
        candidateInfo,
        jobDescription: mission.description,
        fullCandidate: candidate
      }, 
      recordId: newRecord.id,
      creditsRemaining: deductResult.success ? (deductResult.creditsRemaining ?? 0) : (creditCheck.currentCredits ?? 0) 
    }));

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
      error: `Détails de l'erreur : ${message}` 
    };
  }
}
