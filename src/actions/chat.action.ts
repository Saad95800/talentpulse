"use server";

import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { sendAdminChatNotification, sendUserChatNotification } from "@/lib/mail";

/**
 * Envoie un message
 */
export async function sendMessageAction(token: string, content: string, recipientUserId?: string) {
  try {
    const decoded = verifyToken(token);
    if (!decoded) return { success: false, error: "Non autorisé" };

    const sender = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, firstName: true, lastName: true, email: true }
    });

    if (!sender) return { success: false, error: "Utilisateur introuvable" };

    // Si admin envoie à un user spécifique, ou user envoie (crée/trouve sa propre conv)
    const targetUserId = sender.role === 'ADMIN' ? recipientUserId : sender.id;

    if (!targetUserId) return { success: false, error: "Destinataire manquant" };

    // Trouver ou créer la conversation
    let conversation = await prisma.conversation.findUnique({
      where: { userId: targetUserId }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userId: targetUserId }
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content,
        senderId: sender.id,
        senderRole: sender.role,
        isRead: false
      }
    });

    // Mettre à jour le timestamp de la conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    // Notifications E-mail
    if (sender.role === 'USER') {
      const userName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.id;
      // Optionnel: Envoyer seulement si l'admin n'est pas déjà sur la page ? 
      // Pour l'instant on envoie toujours pour être sûr.
      await sendAdminChatNotification(userName, sender.id, content.substring(0, 100));
    } else {
      // Admin répond
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { email: true }
      });
      if (targetUser) {
        await sendUserChatNotification(targetUser.email, content.substring(0, 100));
      }
    }

    return { success: true, message };
  } catch (error) {
    console.error("Erreur sendMessageAction:", error);
    return { success: false, error: "Erreur serveur" };
  }
}

/**
 * Récupère les messages d'une conversation
 */
export async function getMessagesAction(token: string, userId?: string) {
  try {
    const decoded = verifyToken(token) as { userId: string } | null;
    if (!decoded) return { success: false, error: "Non autorisé" };

    const requester = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true, id: true }
    });

    if (!requester) return { success: false, error: "Utilisateur introuvable" };

    const targetId = (requester.role === 'ADMIN' && userId) ? userId : requester.id;

    const conversation = await prisma.conversation.findUnique({
      where: { userId: targetId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return { success: true, messages: conversation?.messages || [] };
  } catch (_error) {
    return { success: false, error: "Erreur serveur" };
  }
}

/**
 * Liste toutes les conservations (Admin)
 */
export async function getAdminChatListAction(token: string) {
  try {
    const decoded = verifyToken(token) as { userId: string } | null;
    if (!decoded) return { success: false, error: "Non autorisé" };

    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!admin || admin.role !== 'ADMIN') return { success: false, error: "Accès refusé" };

    const conversations = await prisma.conversation.findMany({
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return { success: true, conversations };
  } catch (_error) {
    return { success: false, error: "Erreur serveur" };
  }
}

/**
 * Marquer comme vu
 */
export async function markAsReadAction(token: string, conversationId: string) {
    try {
        const decoded = verifyToken(token);
        if (!decoded) return { success: false, error: "Non autorisé" };

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) return { success: false, error: "Utilisateur introuvable" };

        // On marque comme lus les messages qui n'ont pas été envoyés par celui qui fait l'action
        await prisma.message.updateMany({
            where: {
                conversationId,
                isRead: false,
                senderRole: user.role === 'ADMIN' ? 'USER' : 'ADMIN'
            },
            data: { isRead: true }
        });

        return { success: true };
    } catch (_error) {
        return { success: false, error: "Erreur serveur" };
    }
}
