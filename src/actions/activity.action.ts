"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Schéma de validation pour une activité
const activitySchema = z.object({
  userId: z.string().uuid(),
  type: z.string(),
  description: z.string().optional().nullable(),
  path: z.string().optional().nullable(),
  target: z.string().optional().nullable(),
  metadata: z.any().optional().nullable(),
});

/**
 * Log une activité utilisateur (Appelée depuis le Frontend)
 * Conçue pour être robuste et ne jamais faire crash l'interface.
 */
export async function logUserActivityAction(rawData: any) {
  try {
    const data = activitySchema.parse(rawData);

    await prisma.userActivity.create({
      data: {
        userId: data.userId,
        type: data.type,
        description: data.description || "",
        path: data.path || "/",
        target: data.target || "N/A",
        metadata: data.metadata || {},
      },
    });

    return { success: true };
  } catch (error) {
    // Fail-silent : on log en console serveur mais on ne bloque pas l'utilisateur
    console.error(`[Activity:LogFailed]`, error instanceof Error ? error.message : "Erreur inconnue");
    return { success: false, error: "Logging failed" };
  }
}

/**
 * Récupère tous les utilisateurs avec des statistiques agrégées (ADMIN SEULEMENT)
 */
export async function getAllUsersAdminAction(token: string) {
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'ADMIN') throw new Error("Accès non autorisé.");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credits: true,
        createdAt: true,
        _count: {
          select: {
            activities: true,
            matches: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, users };
  } catch (error: any) {
    console.error(`[Admin:UsersFetchFailed]`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Récupère l'historique complet d'un utilisateur (ADMIN SEULEMENT)
 */
export async function getUserDetailedActivityAdminAction(token: string, targetUserId: string) {
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'ADMIN') throw new Error("Accès non autorisé.");

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credits: true,
        createdAt: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 1000,
        },
        matches: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
             mission: true,
             candidate: true
          }
        }
      }
    });

    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    return { success: true, user };
  } catch (error: any) {
    console.error(`[Admin:UserDetailsFailed]`, error.message);
    return { success: false, error: error.message };
  }
}
