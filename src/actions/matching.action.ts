"use server";

import prisma from "@/lib/prisma";
import { addMatchingJob } from "@/lib/queue/matching-queue";
import { extractTextFromFile } from "@/lib/document";
import { generateJobTitle } from "@/lib/ai";
import { handleActionError, handleActionSuccess } from "@/lib/error-handler";
import { MatchingService } from "@/lib/matching/service";

/**
 * Optimized Orchestrator: Refactored to use MatchingService
 */
export async function processMatchingWorkflow(formData: FormData) {
  const startTime = Date.now();
  const userId = formData.get('userId') as string;
  const skipDeduction = formData.get('skipDeduction') === 'true';

  try {
    const result = await MatchingService.runFullWorkflow({
      userId,
      jobFile: formData.get('jobFile') as File | null,
      cvFile: formData.get('cvFile') as File | null,
      jobTextRaw: formData.get('jobTextRaw') as string | null,
      cvTextRaw: formData.get('cvTextRaw') as string | null,
      skipDeduction
    });

    if (!result.success) {
      return result;
    }

    // Standard Log
    await handleActionSuccess(`Matching réussi pour ${userId}`, {
      userId,
      actionName: "processMatchingWorkflow",
      context: { recordId: result.recordId }
    });

    // UX : Minimum duration for visibility
    const duration = Date.now() - startTime;
    if (duration < 1500) await new Promise(r => setTimeout(r, 1500 - duration));

    // CLEAN DATA (Next.js 16 handles serialization well, no need for JSON trick unless circular)
    return {
      success: true,
      data: result.data,
      recordId: result.recordId,
      creditsRemaining: result.creditsRemaining
    };

  } catch (error) {
    return handleActionError("Échec du workflow de matching", error, {
      userId,
      actionName: "processMatchingWorkflow"
    });
  }
}

/**
 * Action de démarrage de Matching en arrière-plan (BullMQ)
 */
export async function startBatchMatchingAction(formData: FormData) {
  const userId = formData.get('userId') as string;
  try {
    const jobFile = formData.get('jobFile') as File | null;
    const jobTextRaw = formData.get('jobTextRaw') as string | null;
    const cvFiles = formData.getAll('cvFiles') as File[];

    if (!userId) return { success: false, error: "Utilisateur non identifié." };
    if (cvFiles.length === 0) return { success: false, error: "Aucun CV fourni." };

    // Optimize: Select only necessary fields
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    const plan = user?.plan || 'FREE';
    const limit = plan === 'PREMIUM' ? 10 : 3;

    if (cvFiles.length > limit) {
      return { 
        success: false, 
        error: `Votre forfait (${plan}) limite l'analyse groupée à ${limit} CV. Veuillez passer à Premium.` 
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

    const aiJobTitle = await generateJobTitle(jobText);

    // 2. Transaction-like creation
    const batchJob = await prisma.batchJob.create({
      data: {
        userId,
        totalItems: cvFiles.length,
        status: 'PROCESSING'
      }
    });

    // 3. Queue immediate
    for (const cvFile of cvFiles) {
      const arrayBuffer = await cvFile.arrayBuffer();
      const cvBufferBase64 = Buffer.from(arrayBuffer).toString('base64');
      
      const item = await prisma.batchItem.create({
        data: {
          batchJobId: batchJob.id,
          candidateName: cvFile.name,
          status: 'PENDING'
        }
      });

      await addMatchingJob({
        userId,
        batchJobId: batchJob.id,
        batchItemId: item.id,
        jobText,
        jobTitle: aiJobTitle,
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
    return handleActionError("Échec du lancement du batch", error, {
      userId,
      actionName: "startBatchMatchingAction"
    });
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
            matchRecord: {
              select: {
                id: true,
                score: true,
                aiResponse: true,
                candidateName: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!batchJob) return { success: false, error: "Batch introuvable." };
    return { success: true, data: batchJob };
  } catch (error) {
    return handleActionError("Erreur récupération statut batch", error, { context: { batchJobId } });
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
          select: { id: true, status: true } // Reduced payload
        }
      }
    });

    return { success: true, data: activeBatch };
  } catch (error) {
    return handleActionError("Erreur récupération batch actif", error, { userId });
  }
}

/**
 * Annule un batch actif
 */
export async function cancelActiveBatchAction(batchJobId: string) {
  try {
    await prisma.batchJob.update({
      where: { id: batchJobId },
      data: { status: 'FAILED' }
    });
    return { success: true };
  } catch (error) {
    return handleActionError("Impossible d'annuler le batch", error, { context: { batchJobId } });
  }
}
