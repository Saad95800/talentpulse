"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { deductCredit, checkCredits } from "./credits.action";
import { extractTextFromFile } from "@/lib/document";
import { generateMatchingScore, extractCandidateInfo } from "@/lib/ai";
import { logError, logInfo, logWarn } from "./logger.action";

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
    
    // Validation de sécurité sur la taille cumulée (Max 10MB total pour éviter timeout serveur)
    const totalSize = (jobFile?.size || 0) + (cvFile?.size || 0);
    if (totalSize > 10 * 1024 * 1024) {
      return { success: false, error: "La taille cumulée des fichiers dépasse 10 Mo. Veuillez compresser vos documents." };
    }

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

    const mission = await prisma.mission.create({
      data: {
        userId,
        title: jobTitle,
        description: jobText,
      }
    });

    const candidate = await prisma.candidate.create({
      data: {
        userId,
        name: `${candidateInfo.firstName || ''} ${candidateInfo.lastName || ''}`.trim() || candidateName,
        firstName: candidateInfo.firstName,
        lastName: candidateInfo.lastName,
        email: candidateInfo.email,
        phone: candidateInfo.phone,
        address: candidateInfo.address,
        linkedin: candidateInfo.linkedin,
        website: candidateInfo.website,
        summary: candidateInfo.summary,
        languages: (candidateInfo.languages || []) as any,
        skills: (candidateInfo.skills || []) as any,
        experiences: (candidateInfo.experiences || []) as any,
        educations: (candidateInfo.educations || []) as any,
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
      data: {
        ...resultIA,
        jobDescription: mission.description,
        fullCandidate: candidate
      }, 
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
      error: `Détails de l'erreur : ${message}` 
    };
  }
}
