import { Job } from 'bullmq';
import { MatchingJobData } from './types';
import prisma from '@/lib/prisma';
import { processSingleMatch } from '../matching/core';
import { extractTextFromFile } from '../document';
import { extractCandidateInfo } from '../ai';

export async function matchingProcessor(job: Job<MatchingJobData>) {
  const { batchJobId, batchItemId, userId, jobText, cvBufferBase64, cvFileName } = job.data;
  let { cvText, candidateInfo } = job.data;

  console.log(`[Worker] Traitement du Job ${job.id} (BatchItem: ${batchItemId})`);

  try {
    // 1. Mettre à jour le statut du BatchItem à PROCESSING
    await prisma.batchItem.update({
      where: { id: batchItemId },
      data: { status: 'PROCESSING' }
    });

    // 2. Si le texte et les infos manquent, on les extrait maintenant (Async Extraction)
    if (cvBufferBase64 && (!cvText || !candidateInfo)) {
      console.log(`[Worker] Extraction différée pour ${cvFileName}...`);
      const buffer = Buffer.from(cvBufferBase64, 'base64');
      const cvDoc = await extractTextFromFile(buffer, cvFileName || 'document.pdf');
      cvText = cvDoc.text.substring(0, 30000);

      const cvFileData = {
        buffer,
        mimeType: cvDoc.mimeType || 'application/pdf',
        isScanned: cvDoc.isScanned
      };

      // IA Extraction Profil (Gemini)
      const extractedInfo = await extractCandidateInfo(cvText, cvFileData);
      candidateInfo = extractedInfo;

      // CRITIQUE : Mettre à jour le nom RÉEL dans la DB immédiatement pour le polling
      const candidateName = `${candidateInfo?.firstName || ''} ${candidateInfo?.lastName || ''}`.trim() || cvFileName || 'Candidat';
      await prisma.batchItem.update({
        where: { id: batchItemId },
        data: { 
          candidateName,
          cvText 
        }
      });
      console.log(`[Worker] Nom identifié: ${candidateName}`);
    }

    if (!cvText || !candidateInfo) {
      throw new Error("Impossible d'extraire les données du CV (Données manquantes après extraction).");
    }

    // 3. Lancer le matching
    const result = await processSingleMatch({
      userId,
      jobTitle: job.data.jobTitle || "Analyse Groupée",
      jobText,
      candidateName: `${candidateInfo.firstName || ''} ${candidateInfo.lastName || ''}`.trim() || 'Candidat',
      cvText,
      candidateInfo: candidateInfo!
    });

    // 4. Enregistrer le succès et lier le MatchRecord
    await prisma.$transaction([
      prisma.batchItem.update({
        where: { id: batchItemId },
        data: { 
          status: 'COMPLETED',
          matchRecordId: result.recordId
        }
      }),
      prisma.batchJob.update({
        where: { id: batchJobId },
        data: { 
          processedItems: { increment: 1 }
        }
      })
    ]);

    // 4. Vérifier si le BatchJob est terminé
    const updatedJob = await prisma.batchJob.findUnique({
      where: { id: batchJobId },
      include: { _count: { select: { items: true } } }
    });

    if (updatedJob && updatedJob.processedItems >= updatedJob.totalItems) {
      await prisma.batchJob.update({
        where: { id: batchJobId },
        data: { status: 'COMPLETED' }
      });
      console.log(`[Worker] BatchJob ${batchJobId} terminé avec succès.`);
    }

    return { success: true, recordId: result.recordId };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Worker] Erreur sur le Job ${job.id}:`, error);

    await prisma.batchItem.update({
      where: { id: batchItemId },
      data: { 
        status: 'FAILED',
        error: errorMessage
      }
    });

    // Incrementer quand même le compteur de progression pour éviter que la barre reste bloquée
    const updatedBatch = await prisma.batchJob.update({
      where: { id: batchJobId },
      data: { 
        processedItems: { increment: 1 }
      },
      include: { _count: { select: { items: true } } }
    });

    // CRITIQUE : Si c'était le dernier item, on marque le batch comme COMPLETED (même s'il y a des erreurs internes)
    // Cela permet au polling du dashboard de s'arrêter et de libérer l'UI.
    if (updatedBatch && updatedBatch.processedItems >= updatedBatch.totalItems) {
      await prisma.batchJob.update({
        where: { id: batchJobId },
        data: { status: 'COMPLETED' }
      });
      console.log(`[Worker] BatchJob ${batchJobId} terminé avec erreurs.`);
    }

    throw error; // BullMQ gérera le retry
  }
}
