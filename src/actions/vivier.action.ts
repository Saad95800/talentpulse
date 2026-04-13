"use server";

import prisma from "@/lib/prisma";
import { aiComplete } from "@/lib/ai/index";

/**
 * Interface pour le message de chat
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Action pour interroger le vivier de candidats via l'IA.
 * @param userId ID de l'utilisateur
 * @param messages Historique de la conversation
 */
export async function queryVivierIA(userId: string, messages: ChatMessage[]) {
  try {
    // 1. Récupérer tous les candidats du vivier pour cet utilisateur
    const candidates = await prisma.matchRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    if (candidates.length === 0) {
      return { 
        success: true, 
        message: "Vous n'avez pas encore de candidats dans votre vivier. Importez des CV pour commencer !" 
      };
    }

    // 2. Formater le contexte pour l'IA
    const vivierContext = candidates.map(c => {
      const resp = c.aiResponse as any;
      return `CANDIDAT: ${c.candidateName} | POSTE: ${c.jobTitle} | SCORE: ${c.score}/100 
COMPÉTENCES: ${resp.competences_validees?.join(', ')}
LACUNES: ${resp.competences_manquantes?.join(', ')}
VERDICT: ${resp.argumentaire_client}`;
    }).join('\n---\n');

    // 3. Préparer le prompt système
    const systemPrompt = `Tu es un Assistant Recrutement IA expert. Ton rôle est d'aider le recruteur à analyser son vivier de candidats.
Voici les données des candidats actuellement enregistrés dans le système :

${vivierContext}

Instructions :
- Réponds de manière professionnelle et concise.
- Cite toujours le nom des candidats pour étayer tes réponses.
- Si l'utilisateur demande "Qui matche le mieux pour X ?", base-toi sur les scores et les compétences validées.
- Si l'utilisateur demande un résumé, fais un comparatif structuré.
- Ne parle jamais de fichiers techniques ou de JSON, reste focalisé sur le recrutement.`;

    // 4. Appel IA via l'abstraction (provider configuré : Gemini par défaut)
    const text = await aiComplete(
      messages,
      { system: systemPrompt, maxTokens: 2000, temperature: 0.7 },
      'main'
    );

    return { 
      success: true, 
      message: text
    };

  } catch (error: any) {
    console.error("Erreur Query Vivier IA:", error);
    return { 
      success: false, 
      error: "Impossible de contacter l'assistant IA pour le moment." 
    };
  }
}
