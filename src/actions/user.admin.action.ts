"use server";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";



const updateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  plan: z.string().optional(),
  isActive: z.boolean().optional(),
  credits: z.number().int().optional(),
});

/**
 * Récupère la liste des utilisateurs avec pagination et recherche
 */
export async function getAdminUsersAction(token: string, page = 1, search = "") {
  try {
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') throw new Error("Accès non autorisé.");

    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const where = search ? {
      OR: [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          plan: true,
          credits: true,
          totalCreditsUsed: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.user.count({ where })
    ]);

    return { 
      success: true, 
      users, 
      pagination: {
        total,
        pages: Math.ceil(total / pageSize),
        currentPage: page
      }
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: errorMsg };
  }
}

/**
 * Récupère le détail complet d'un utilisateur
 */
export async function getAdminUserDetailAction(token: string, targetUserId: string) {
  try {
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') throw new Error("Accès non autorisé.");

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        missions: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        candidates: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!user) throw new Error("Utilisateur introuvable.");

    return { success: true, user };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: errorMsg };
  }
}

/**
 * Met à jour un utilisateur
 */
export async function updateAdminUserAction(token: string, targetUserId: string, data: any) {
  try {
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') throw new Error("Accès non autorisé.");

    const validatedData = updateSchema.parse(data);

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: validatedData
    });

    return { success: true, user: updatedUser };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: errorMsg };
  }
}

/**
 * Ajuste les crédits manuellement
 */
export async function adjustUserCreditsAction(token: string, targetUserId: string, amount: number) {
  try {
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') throw new Error("Accès non autorisé.");

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        credits: { increment: amount }
      }
    });

    return { success: true, credits: updatedUser.credits };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: errorMsg };
  }
}
