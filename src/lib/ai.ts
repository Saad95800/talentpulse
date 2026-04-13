import { getAIProvider, createProvider } from '@/lib/ai/index';

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
 * Utilise le provider IA actif. En cas de 404/529 (modèle indisponible ou serveur surchargé),
 * bascule automatiquement sur Gemini 2.0 Flash.
 */
export async function generateMatchingScore(jobText: string, cvText: string): Promise<MatchResult> {
  const systemPrompt = `Tu es un expert en recrutement de niveau "Senior Executive Partner" et "Chasseur de Têtes" spécialisé dans les profils hautement qualifiés.
Ton rôle est de fournir une analyse de matching d'une précision chirurgicale entre une fiche de poste et un CV.
Tu dois évaluer non seulement les compétences techniques (hard skills), mais aussi le potentiel d'évolution et l'adéquation culturelle suggérée par le parcours.

TU DOIS RETOURNER TON ANALYSE STRICTEMENT AU FORMAT JSON. Aucun texte conversationnel ne doit précéder ou suivre le JSON.
Le format attendu est :
{
  "score": number (0 à 100),
  "competences_validees": string[] (liste détaillée des points forts),
  "competences_manquantes": string[] (écarts critiques ou points de vigilance),
  "argumentaire_client": string (un paragraphe de 4-5 phrases, très qualitatif, persuasif et structuré, destiné à un décideur RH)
}`;

  const userPrompt = `Voici la Fiche de Poste :\n---\n${jobText}\n---\n\nVoici le CV du candidat :\n---\n${cvText}\n---\n\nAnalyse le matching et renvoie uniquement le JSON.`;

  const messages = [{ role: 'user' as const, content: userPrompt }];
  const callOptions = { system: systemPrompt, maxTokens: 4000, temperature: 0 };

  // 1. Tenter avec le provider configuré (priorité Anthropic)
  try {
    const provider = await getAIProvider('matching');
    const rawText  = await provider.complete(messages, callOptions);
    return extractJSON(rawText);
  } catch (primaryError: any) {
    const msg    = primaryError?.message ?? '';
    const status = primaryError?.status  ?? 0;

    // Si le provider principal échoue pour une raison transitoire (surcharge ou modèle introuvable)
    // → fallback silencieux sur Gemini 2.0 Flash
    const isTransient =
      status === 529 ||
      status === 404 ||
      status === 503 ||
      msg.includes('overloaded') ||
      msg.includes('not_found')  ||
      msg.includes('unavailable');

    if (isTransient && process.env.GEMINI_API_KEY) {
      console.warn(`[AI Fallback] Provider principal indisponible (${status || msg.slice(0, 60)}). Bascule sur Gemini...`);
      try {
        const geminiProvider = createProvider('gemini', 'matching');
        const rawText        = await geminiProvider.complete(messages, callOptions);
        return extractJSON(rawText);
      } catch (fallbackError: any) {
        // Si Gemini échoue aussi, on remonte une erreur lisible
        throw new Error('Nos serveurs IA sont temporairement surchargés. Veuillez réessayer dans quelques instants.');
      }
    }

    // Erreur non-transiente (401, quota…) : on la remonte directement
    throw primaryError;
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
