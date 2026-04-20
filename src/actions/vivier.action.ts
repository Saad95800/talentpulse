"use server";

import prisma from "@/lib/prisma";
import { aiComplete } from "@/lib/ai/index";
import { MatchResult } from "@/lib/ai";

/**
 * Interface pour le message de chat
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Récupère tous les candidats du vivier pour un utilisateur
 */
export async function getCandidatesAction(userId: string, page: number = 1, limit: number = 20) {
  try {
    const totalCount = await prisma.candidate.count({ where: { userId } });
    const totalPages = Math.ceil(totalCount / limit);

    const candidates = await prisma.candidate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { 
      success: true, 
      candidates, 
      totalCount, 
      totalPages,
      currentPage: page 
    };
  } catch (error) {
    console.error("Erreur getCandidatesAction:", error);
    return { success: false, error: "Impossible de récupérer les candidats." };
  }
}

/**
 * Récupère toutes les missions du vivier pour un utilisateur
 */
export async function getMissionsAction(userId: string, page: number = 1, limit: number = 20) {
  try {
    const totalCount = await prisma.mission.count({ where: { userId } });
    const totalPages = Math.ceil(totalCount / limit);

    const missions = await prisma.mission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { 
      success: true, 
      missions, 
      totalCount, 
      totalPages,
      currentPage: page 
    };
  } catch (error) {
    console.error("Erreur getMissionsAction:", error);
    return { success: false, error: "Impossible de récupérer les missions." };
  }
}

/**
 * Supprime un candidat et ses analyses associées (cascade logicielle via Prisma)
 */
export async function deleteCandidateAction(candidateId: string, userId: string) {
  try {
    // Vérification de propriété
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }});
    if (!candidate || candidate.userId !== userId) {
      return { success: false, error: "Non autorisé ou introuvable." };
    }

    await prisma.candidate.delete({ where: { id: candidateId }});
    return { success: true };
  } catch (error) {
    console.error("Erreur deleteCandidateAction:", error);
    return { success: false, error: "Erreur lors de la suppression." };
  }
}

/**
 * Supprime une mission et ses analyses associées
 */
export async function deleteMissionAction(missionId: string, userId: string) {
  try {
    // Vérification de propriété
    const mission = await prisma.mission.findUnique({ where: { id: missionId }});
    if (!mission || mission.userId !== userId) {
      return { success: false, error: "Non autorisé ou introuvable." };
    }

    await prisma.mission.delete({ where: { id: missionId }});
    return { success: true };
  } catch (error) {
    console.error("Erreur deleteMissionAction:", error);
    return { success: false, error: "Erreur lors de la suppression." };
  }
}

/**
 * Action pour interroger le vivier de candidats via l'IA.
 * @param userId ID de l'utilisateur
 * @param messages Historique de la conversation
 */
export async function queryVivierIA(userId: string, messages: ChatMessage[]) {
  try {
    // 1. Récupérer les analyses récentes pour donner du contexte à l'IA
    const records = await prisma.matchRecord.findMany({
      where: { userId },
      include: {
        candidate: true,
        mission: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20, // On prend les 20 plus récents pour le contexte
    });

    if (records.length === 0) {
      return { 
        success: true, 
        message: "Vous n'avez pas encore d'analyses dans votre vivier. Importez des CV et des offres pour commencer !" 
      };
    }

    // 2. Formater le contexte pour l'IA
    const vivierContext = records.map(r => {
      const resp = r.aiResponse as unknown as MatchResult;
      return `MATCHING: ${r.candidateName} vs ${r.jobTitle}
SCORE: ${r.score}/100 
COMPÉTENCES VALIDÉES: ${resp?.competences_validees?.join(', ')}
POINTS DE VIGILANCE: ${resp?.competences_manquantes?.join(', ')}
VERDICT: ${resp?.argumentaire_client}`;
    }).join('\n---\n');

    // 3. Préparer le prompt système
    const systemPrompt = `Tu es un Assistant Recrutement IA expert. Ton rôle est d'aider le recruteur à analyser son vivier de candidats et ses missions.
Voici les données des matchings récents effectués par l'utilisateur :

${vivierContext}

Instructions :
- Réponds de manière professionnelle, proactive et concise.
- Utilise les prénoms des candidats pour personnaliser tes réponses.
- Si l'utilisateur pose une question sur un candidat spécifique, utilise les données de matching ci-dessus.
- Aide le recruteur à prendre des décisions rapides (Qui envoyer en entretien ? Pourquoi ?).`;

    // 4. Appel IA via l'abstraction
    const text = await aiComplete(
      messages,
      { system: systemPrompt, maxTokens: 2000, temperature: 0.7 },
      'main'
    );

    return { 
      success: true, 
      message: text
    };

  } catch (error) {
    console.error("Erreur Query Vivier IA:", error);
    return { 
      success: false, 
      error: "Impossible de contacter l'assistant IA pour le moment." 
    };
  }
}
