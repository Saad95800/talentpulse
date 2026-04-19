"use server";

import prisma from "@/lib/prisma";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Schéma de validation pour une activité
const activitySchema = z.object({
  userId: z.string().uuid(),
  type: z.string(),
  description: z.string().optional().nullable(),
  path: z.string().optional(),
  target: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Log une activité utilisateur (Appelée depuis le Frontend)
 * Conçue pour être robuste et ne jamais faire crash l'interface.
 */
export async function logUserActivityAction(data: unknown) {
  try {
    const validatedData = activitySchema.parse(data);
    
    await prisma.userActivity.create({
      data: {
        userId: validatedData.userId,
        type: validatedData.type,
        path: validatedData.path || "/",
        description: validatedData.description || "",
        target: validatedData.target || "",
        metadata: validatedData.metadata ? (validatedData.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    return { success: true };
  } catch (error) {
    // FAIL-SILENT : On log l'erreur sur le serveur mais on ne bloque pas l'utilisateur
    console.error("[ActivityLogger:SilentFailure]", error instanceof Error ? error.message : error);
    return { success: true, error: "Logging suppressed" }; 
  }
}

/**
 * Récupère tous les utilisateurs avec des statistiques agrégées (ADMIN SEULEMENT)
 */
export async function getAllUsersAdminAction(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JWTPayload;
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error(`[Admin:UsersFetchFailed]`, message);
    return { success: false, error: message };
  }
}

/**
 * Récupère l'historique complet d'un utilisateur (ADMIN SEULEMENT)
 */
export async function getUserDetailedActivityAdminAction(token: string, targetUserId: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JWTPayload;
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error(`[Admin:UserDetailsFailed]`, message);
    return { success: false, error: message };
  }
}
