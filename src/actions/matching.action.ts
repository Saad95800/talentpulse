"use server";

import prisma from "@/lib/prisma";
import { deductCredit, checkCredits } from "./credits.action";
import { extractTextFromFile } from "@/lib/document";
import { extractCandidateInfo, validateDocumentConformity, generateJobTitle } from "@/lib/ai";
import { logError, logInfo } from "./logger.action";
import { processSingleMatch } from "@/lib/matching/core";
import { addMatchingJob } from "@/lib/queue/matching-queue";

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
        // jobTitle = jobFile.name.replace(/\.[^/.]+$/, ""); // Ancienne méthode
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        console.error(`[Workflow] Échec extraction Job:`, err);
        return { success: false, error: `Erreur sur la fiche de poste : ${message}` };
      }
    } else if (jobTextRaw) {
      jobText = jobTextRaw.substring(0, 30000);
    }

    // Génération d'un titre intelligent par l'IA
    console.log("[Workflow] Génération du titre de mission via IA...");
    jobTitle = await generateJobTitle(jobText);
    console.log(`[Workflow] Titre généré : ${jobTitle}`);

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
    
    // 2. Traitement du matching via le Core partagé
    console.log("[Workflow] Étape 2: Matching Sémantique et Sauvegarde...");
    const resultIA = await processSingleMatch({
      userId,
      jobTitle,
      jobText,
      candidateName,
      cvText,
      candidateInfo
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
      recordId: resultIA.recordId,
      missionId: resultIA.mission.id,
      candidateId: resultIA.candidate.id 
    });
    
    return JSON.parse(JSON.stringify({ 
      success: true, 
      data: {
        ...resultIA.resultIA,
        candidateInfo,
        jobTitle: resultIA.mission.title,
        jobDescription: resultIA.mission.description,
        fullCandidate: resultIA.candidate
      }, 
      recordId: resultIA.recordId,
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

/**
 * Action de démarrage de Matching en arrière-plan (BullMQ)
 */
export async function startBatchMatchingAction(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const jobFile = formData.get('jobFile') as File | null;
    const jobTextRaw = formData.get('jobTextRaw') as string | null;
    const cvFiles = formData.getAll('cvFiles') as File[];

    console.log(`[BatchAction] Démarrage. Modèles Prisma détectés:`, Object.keys(prisma || {}).filter(k => !k.startsWith('_')));
    if (!prisma.batchJob) {
      throw new Error("Le modèle 'BatchJob' est introuvable sur le client Prisma. Un redémarrage de 'npm run dev' est peut-être nécessaire.");
    }
    
    if (!userId) return { success: false, error: "Utilisateur non identifié." };
    if (cvFiles.length === 0) return { success: false, error: "Aucun CV fourni." };

    // Vérification du plan et des limites de batch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    const plan = user?.plan || 'FREE';
    const limit = plan === 'PREMIUM' ? 10 : 3;

    if (cvFiles.length > limit) {
      return { 
        success: false, 
        error: `Votre forfait (${plan}) limite l'analyse groupée à ${limit} CV par demande. Veuillez passer à Premium pour augmenter cette limite.` 
      };
    }

    // 1. Extraction du Job Description (JD)
    let jobText = "";
    if (jobFile && jobFile.size > 0) {
      const buffer = Buffer.from(await jobFile.arrayBuffer());
      const doc = await extractTextFromFile(buffer, jobFile.name);
      jobText = doc.text.substring(0, 30000);
    } else if (jobTextRaw) {
      jobText = jobTextRaw.substring(0, 30000);
    }

    // 1.5 Génération d'un titre intelligent pour tout le lot
    console.log("[BatchAction] Génération du titre de mission via IA...");
    const aiJobTitle = await generateJobTitle(jobText);
    console.log(`[BatchAction] Titre généré : ${aiJobTitle}`);

    // 2. Création du BatchJob en DB
    const batchJob = await prisma.batchJob.create({
      data: {
        userId,
        totalItems: cvFiles.length,
        status: 'PROCESSING'
      }
    });

    // 3. Queue immédiate de chaque CV (Traitement différé)
    for (const cvFile of cvFiles) {
      // Lecture ultra-rapide du buffer (en mémoire)
      const arrayBuffer = await cvFile.arrayBuffer();
      const cvBufferBase64 = Buffer.from(arrayBuffer).toString('base64');
      
      const candidateNamePlaceholder = cvFile.name; // Fallback initial

      // Création du BatchItem (Statut PENDING)
      const item = await prisma.batchItem.create({
        data: {
          batchJobId: batchJob.id,
          candidateName: candidateNamePlaceholder,
          status: 'PENDING'
          // cvText n'est plus requis ici, le worker s'en chargera
        }
      });

      // Ajout à la file d'attente BullMQ avec les données brutes
      await addMatchingJob({
        userId,
        batchJobId: batchJob.id,
        batchItemId: item.id,
        jobText,
        jobTitle: aiJobTitle, // On passe le titre généré par l'IA
        cvBufferBase64,
        cvFileName: cvFile.name
      });
    }

    return { 
      success: true, 
      batchJobId: batchJob.id,
      message: `${cvFiles.length} CVs envoyés en traitement.` 
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[startBatchMatchingAction] Erreur critique:", error);
    return { 
      success: false, 
      error: `Erreur lors du lancement : ${message}` 
    };
  }
}

/**
 * Récupère l'état d'un batch et ses résultats
 */
export async function getBatchStatusAction(batchJobId: string) {
  try {
    const batchJob = await prisma.batchJob.findUnique({
      where: { id: batchJobId },
      include: {
        items: {
          include: {
            matchRecord: true
          }
        }
      }
    });

    if (!batchJob) return { success: false, error: "Batch introuvable." };

    return { success: true, data: batchJob };
  } catch (error) {
    console.error("[getBatchStatusAction] Erreur:", error);
    return { success: false, error: "Erreur lors de la récupération du statut." };
  }
}

/**
 * Récupère le dernier batch actif d'un utilisateur
 */
export async function getActiveBatchAction(userId: string) {
  try {
    const activeBatch = await prisma.batchJob.findFirst({
      where: { 
        userId,
        status: { in: ['PENDING', 'PROCESSING'] }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            matchRecord: true
          }
        }
      }
    });

    return { success: true, data: activeBatch };
  } catch {
    return { success: false, error: "Erreur récupération batch actif." };
  }
}

/**
 * Annule un batch actif pour débloquer l'utilisateur
 */
export async function cancelActiveBatchAction(batchJobId: string) {
  try {
    await prisma.batchJob.update({
      where: { id: batchJobId },
      data: { status: 'FAILED' }
    });
    return { success: true };
  } catch (error) {
    console.error("[cancelActiveBatchAction] Erreur:", error);
    return { success: false, error: "Impossible d'annuler le batch." };
  }
}
