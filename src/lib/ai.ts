import { getAIProvider, createProvider } from '@/lib/ai/index';

/**
 * Interface pour le résultat structuré du matching IA.
 */
export interface CandidateInfo {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  linkedin?: string;
  website?: string;
  summary?: string;
  languages?: string[];
  skills?: string[];
  experiences?: {
    company: string;
    position: string;
    period: string;
    description: string;
  }[];
  educations?: {
    school: string;
    degree: string;
    year: string;
  }[];
}

export interface MatchResult {
  score: number;
  competences_validees: string[];
  competences_manquantes: string[];
  argumentaire_client: string;
  candidateInfo: CandidateInfo;
}

/**
 * Génère un score de matching et une analyse détaillée entre un CV et une Fiche de Poste.
 */
export async function generateMatchingScore(
  jobText: string, 
  cvText: string,
  cvFileData?: { buffer: Buffer, mimeType: string, isScanned: boolean }
): Promise<MatchResult> {
  const systemPrompt = `Tu es un expert en recrutement de niveau "Senior Executive Partner" et "Chasseur de Têtes".
Ton rôle est de fournir une analyse de matching d'une précision chirurgicale ET d'extraire le profil complet du candidat.

${cvFileData?.isScanned ? "ATTENTION: Le document CV fourni est un SCAN ou une IMAGE. Tu dois effectuer un OCR visuel complet pour extraire TOUTES les informations (Nom, Contacts, Expériences, Compétences)." : ""}

TU DOIS RETOURNER TON ANALYSE STRICTEMENT AU FORMAT JSON.
Le format attendu est :
{
  "score": number (0-100),
  "competences_validees": string[],
  "competences_manquantes": string[],
  "argumentaire_client": string,
  "candidateInfo": {
    "firstName": string,
    "lastName": string,
    "email": string,
    "phone": string,
    "address": string,
    "linkedin": string (URL),
    "website": string (URL),
    "summary": string (bio pro),
    "languages": string[],
    "skills": string[],
    "experiences": [
      { "company": string, "position": string, "period": string, "description": string }
    ],
    "educations": [
      { "school": string, "degree": string, "year": string }
    ]
  }
}`;

  const userPrompt = `Voici la Fiche de Poste :\n---\n${jobText}\n---\n\n${cvFileData?.isScanned ? "Voici le CV (sous forme de document/image joint) :" : `Voici le texte du CV :\n---\n${cvText}\n---`}\n\nAnalyse le matching et renvoie uniquement le JSON.`;

  const messages = [{ role: 'user' as const, content: userPrompt }];
  const callOptions = { system: systemPrompt, maxTokens: 4000, temperature: 0 };

  // Helper pour l'appel au provider
  const callProvider = async (provider: any) => {
    if (cvFileData && provider.completeWithDocument) {
      return await provider.completeWithDocument(cvText, cvFileData.buffer, cvFileData.mimeType, callOptions);
    }
    return await provider.complete(messages, callOptions);
  };

  // 1. Tenter avec le provider configuré (priorité Anthropic)
  try {
    const provider = await getAIProvider('matching');
    const rawText  = await callProvider(provider);
    return extractJSON(rawText);
  } catch (primaryError) {
    const msg    = primaryError instanceof Error ? primaryError.message : '';
    // @ts-expect-error - primaryError can have a status property from provider
    const status = primaryError?.status ?? 0;

    // Si le provider principal échoue pour une raison transitoire
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
        const rawText        = await callProvider(geminiProvider);
        return extractJSON(rawText);
      } catch {
        throw new Error('Nos serveurs IA sont temporairement surchargés. Veuillez réessayer dans quelques instants.');
      }
    }

    throw primaryError;
  }
}

function extractJSON(text: string): MatchResult {
  try {
    // 1. Tenter d'extraire le bloc JSON s'il y a des triple backticks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    let jsonString = match ? match[1].trim() : text.trim();
    
    // 2. Nettoyage si jamais il reste des caractères invisibles ou du texte parasite
    // On cherche le premier '{' et le dernier '}' pour isoler l'objet JSON
    const firstBrace = jsonString.indexOf('{');
    const lastBrace  = jsonString.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    try {
      return JSON.parse(jsonString) as MatchResult;
    } catch (parseError) {
      console.error("[AI] Échec du parsing JSON final. Erreur:", parseError, "Texte brut:", text);
      throw new Error("Format de réponse IA invalide (JSON attendu).");
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("Format de réponse")) throw err;
    throw new Error("Impossible d'extraire les données de la réponse IA.");
  }
}
