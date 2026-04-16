"use server";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Récupère l'historique des analyses pour un utilisateur spécifique
 */
export async function getUserHistoryAction(userId: string, token: string) {
  try {
    // Sécurité : Vérifier le token
    const decoded = verifyToken(token) as { userId: string, role: string } | null;
    if (!decoded || decoded.userId !== userId) {
      return { success: false, error: "Non autorisé." };
    }

    const records = await prisma.matchRecord.findMany({
      where: { userId },
      include: {
        mission: true,
        candidate: true
      },
      orderBy: { createdAt: 'desc' },
    });

    return JSON.parse(JSON.stringify({ success: true, records }));
  } catch (error) {
    console.error("Erreur historique utilisateur:", error);
    return { success: false, error: "Impossible de récupérer l'historique." };
  }
}

/**
 * Récupère TOUTES les analyses (Admin seulement)
 */
export async function getAdminHistoryAction(token: string) {
  try {
    // Sécurité : Vérifier le token et le rôle admin
    const decoded = verifyToken(token) as { userId: string, role: string } | null;
    if (!decoded || decoded.role !== 'ADMIN') {
      return { success: false, error: "Accès réservé aux administrateurs." };
    }

    const records = await prisma.matchRecord.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, records };
  } catch (error) {
    console.error("Erreur historique admin:", error);
    return { success: false, error: "Impossible de récupérer l'historique global." };
  }
}

/**
 * Récupère une analyse spécifique par son ID
 */
export async function getAnalysisDetailAction(recordId: string, token: string) {
  try {
    const decoded = verifyToken(token);
    if (!decoded) return { success: false, error: "Session expirée." };

    const record = await prisma.matchRecord.findUnique({
      where: { id: recordId },
      include: {
        user: {
          select: { id: true }
        }
      }
    });

    if (!record) return { success: false, error: "Analyse introuvable." };

    // Vérifier si l'utilisateur est propriétaire ou admin
    const decodedObj = decoded as { userId: string, role: string };
    if (record.userId !== decodedObj.userId && decodedObj.role !== 'ADMIN') {
      return { success: false, error: "Accès refusé." };
    }

    return { success: true, record };
  } catch {
    return { success: false, error: "Erreur lors de la récupération du détail." };
  }
}
