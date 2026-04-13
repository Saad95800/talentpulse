import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  // On ne throw pas ici pour permettre le build, 
  // mais on vérifiera lors de l'appel à la fonction
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'MISSING_KEY',
});

/**
 * Interface pour le résultat structuré du matching IA.
 */
export interface MatchResult {
  score: number;
  competences_validees: string[];
  competences_manquantes: string[];
  argumentaire_client: string;
}

/**
 * Génère un score de matching et une analyse détaillée entre un CV et une Fiche de Poste.
 * @param jobText Texte de la fiche de poste
 * @param cvText Texte du CV
 * @returns MatchResult
 */
export async function generateMatchingScore(jobText: string, cvText: string): Promise<MatchResult> {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'votre_cle_anthropic_ici') {
    throw new Error("Clé API Anthropic manquante. Veuillez configurer ANTHROPIC_API_KEY dans le fichier .env");
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1500,
      temperature: 0,
      system: `Tu es un expert en recrutement IT senior (Tech Recruiter). Ton rôle est d'analyser la pertinence d'un candidat pour un poste donné.
Tu dois retourner ton analyse STRICTEMENT au format JSON. Aucun texte conversationnel ne doit précéder ou suivre le JSON.
Le format attendu est :
{
  "score": number (0 à 100),
  "competences_validees": string[],
  "competences_manquantes": string[],
  "argumentaire_client": string (un court paragraphe professionnel expliquant pourquoi le candidat matche ou non)
}`,
      messages: [
        {
          role: "user",
          content: `Voici la Fiche de Poste :
---
${jobText}
---

Voici le CV du candidat :
---
${cvText}
---

Analyse le matching et renvoie uniquement le JSON.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error("Réponse IA non textuelle inattendue.");
    }

    return extractJSON(content.text);

  } catch (error) {
    console.error("Erreur lors de la génération du score matching:", error);
    throw new Error("Échec de l'analyse IA. " + (error as Error).message);
  }
}

function extractJSON(text: string): MatchResult {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = match ? match[1].trim() : text.trim();
    return JSON.parse(jsonString) as MatchResult;
  } catch (e) {
    throw new Error("Format de réponse IA invalide (JSON attendu).");
  }
}
