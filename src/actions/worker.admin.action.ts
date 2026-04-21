"use server";

import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * Interface pour les statistiques du dashboard worker
 */
export interface WorkerStats {
  totalJobs: number;
  successRate: number;
  processingNow: number;
  failedToday: number;
  usageByDay: { day: string; count: number }[];
}

/**
 * Récupère les statistiques globales des traitements
 */
export async function getWorkerDashboardStats() {
  try {
    const [totalJobs, processedJobs, processingNow, failedToday] = await Promise.all([
      prisma.batchJob.count(),
      prisma.batchJob.count({ where: { status: 'COMPLETED' } }),
      prisma.batchJob.count({ where: { status: 'PROCESSING' } }),
      prisma.batchJob.count({ 
        where: { 
          status: 'FAILED',
          updatedAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
        } 
      })
    ]);

    const successRate = totalJobs > 0 ? (processedJobs / totalJobs) * 100 : 0;

    // Simulation de données pour le graphique (7 derniers jours)
    // En prod on ferait un groupBy
    const usageByDay = [
      { day: 'Lun', count: 12 },
      { day: 'Mar', count: 18 },
      { day: 'Mer', count: 15 },
      { day: 'Jeu', count: 25 },
      { day: 'Ven', count: 20 },
      { day: 'Sam', count: 8 },
      { day: 'Dim', count: 5 },
    ];

    return { 
      success: true, 
      stats: { totalJobs, successRate, processingNow, failedToday, usageByDay } 
    };
  } catch (error) {
    console.error("[getWorkerDashboardStats]", error);
    return { success: false, error: "Erreur stats worker" };
  }
}

/**
 * Récupère la liste paginée des BatchJobs
 */
export async function getBatchJobsList(page: number = 1, limit: number = 10) {
  try {
    const [jobs, total] = await Promise.all([
      prisma.batchJob.findMany({
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          _count: { select: { items: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.batchJob.count()
    ]);

    return { success: true, jobs, total, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    console.error("[getBatchJobsList]", error);
    return { success: false, error: "Erreur liste jobs" };
  }
}

/**
 * Récupère les détails d'un BatchJob (les items)
 */
export async function getBatchJobDetails(jobId: string) {
  try {
    const job = await prisma.batchJob.findUnique({
      where: { id: jobId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          include: { matchRecord: true }
        }
      }
    });

    if (!job) throw new Error("Job introuvable");

    return { success: true, job };
  } catch (error) {
    console.error("[getBatchJobDetails]", error);
    return { success: false, error: "Erreur détails job" };
  }
}

/**
 * Récupère les logs système récents
 */
export async function getSystemLogs(limit: number = 50) {
  try {
    const logs = await prisma.appLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return { success: true, logs };
  } catch (error) {
    console.error("[getSystemLogs]", error);
    return { success: false, error: "Erreur logs" };
  }
}

/**
 * Action critique : Débloquer les jobs coincés (Stuck PROCESSING)
 */
export async function resetStuckJobsAction() {
  try {
    // On considère qu'un job est coincé s'il est en PROCESSING depuis plus de 30 min
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const result = await prisma.batchJob.updateMany({
      where: {
        status: 'PROCESSING',
        updatedAt: { lt: thirtyMinAgo }
      },
      data: {
        status: 'FAILED',
      }
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error("[resetStuckJobsAction]", error);
    return { success: false, error: "Échec du reset" };
  }
}
