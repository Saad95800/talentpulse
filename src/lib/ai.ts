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
 * SCHÉMAS JSON POUR LE CONSTRAINED OUTPUT (Gemini Schema Enforcement)
 */
const candidateInfoSchema = {
  type: "object",
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
    address: { type: "string" },
    linkedin: { type: "string" },
    website: { type: "string" },
    summary: { type: "string" },
    languages: { type: "array", items: { type: "string" } },
    skills: { type: "array", items: { type: "string" } },
    experiences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          position: { type: "string" },
          period: { type: "string" },
          description: { type: "string" }
        },
        required: ["company", "position", "period", "description"]
      }
    },
    educations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          school: { type: "string" },
          degree: { type: "string" },
          year: { type: "string" }
        },
        required: ["school", "degree", "year"]
      }
    }
  },
  required: ["firstName", "lastName"]
};

const matchResultSchema = {
  type: "object",
  properties: {
    score: { type: "number" },
    competences_validees: { type: "array", items: { type: "string" } },
    competences_manquantes: { type: "array", items: { type: "string" } },
    argumentaire_client: { type: "string" }
  },
  required: ["score", "competences_validees", "competences_manquantes", "argumentaire_client"]
};

/**
 * ÉTAPE 1 : Extraction pure du profil candidat
 */
export async function extractCandidateInfo(
  cvText: string,
  cvFileData?: { buffer: Buffer, mimeType: string, isScanned: boolean }
): Promise<CandidateInfo> {
  const systemPrompt = `Tu es un expert en extraction de données RH. Ton rôle est d'extraire le profil COMPLET d'un candidat.
SOIS CONCIS dans les descriptions d'expériences (synthèse des missions).
${cvFileData?.isScanned ? "ATTENTION: Utilisez vos capacités de vision pour compléter les données manquantes." : ""}

RETOURNE UN OBJET JSON STRICT SUIVANT LE SCHÉMA FOURNI.`;

  const userPrompt = cvFileData?.isScanned 
    ? "Extrais le profil depuis ce document joint." 
    : `Extrais le profil depuis ce texte :\n${cvText}`;

  const provider = createProvider('gemini', 'matching');
  const options = { 
    system: systemPrompt, 
    maxTokens: 16000, // Large marge pour les CV denses
    temperature: 0, 
    json: true,
    schema: candidateInfoSchema // Forçage du schéma natif
  };
  
  let rawText: string;
  try {
    if (cvFileData?.isScanned) {
      rawText = await provider.completeWithDocument(cvText, cvFileData.buffer, cvFileData.mimeType, options);
    } else {
      rawText = await provider.complete([{ role: 'user', content: userPrompt }], options);
    }

    if (!rawText) throw new Error("Réponse de l'IA vide.");
    
    return extractJSON<CandidateInfo>(rawText);
  } catch (error: any) {
    console.error("[AI:Extraction] Échec Step 1:", error.message);
    if (typeof rawText! !== 'undefined') {
      console.log("[AI:Extraction] RÉPONSE BRUTE (TRONQUÉE ?) :");
      console.log("------------------------------------------");
      console.log(rawText.slice(0, 1000) + "...");
      console.log("------------------------------------------");
    }
    throw error;
  }
}

/**
 * ÉTAPE 2 : Analyse de Matching
 */
export async function generateMatchingScore(
  jobText: string, 
  cvText: string,
  existingInfo?: CandidateInfo
): Promise<MatchResult> {
  const systemPrompt = `Tu es un expert en recrutement Senior. Analyser le matching poste/candidat.
SOIS PRÉCIS ET CRITIQUE.

RETOURNE UN OBJET JSON STRICT SUIVANT LE SCHÉMA FOURNI.
IMPORTANT: Le champ "score" doit être un nombre entier ou décimal entre 0 et 100 (ex: 85.5 pour 85.5%).`;

  const userPrompt = `FICHE DE POSTE :\n${jobText}\n\nCANDIDAT :\n${existingInfo ? JSON.stringify(existingInfo) : cvText}\n\nAnalyse le matching.`;

  const provider = await getAIProvider('matching');
  const options = { 
    system: systemPrompt, 
    maxTokens: 16000, // Débridage total pour les analyses complexes
    temperature: 0, 
    json: true,
    schema: matchResultSchema // Forçage du schéma natif
  };
  
  const rawText = await provider.complete([{ role: 'user', content: userPrompt }], options);
  return extractJSON<MatchResult>(rawText);
}

function extractJSON<T>(text: string): T {
  let jsonString = text.trim();
  
  try {
    // Avec le mode JSON natif, le texte devrait déjà être du JSON pur
    // Mais on garde un nettoyage de sécurité pour les accolades
    const firstBrace = jsonString.indexOf('{');
    const lastBrace  = jsonString.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(jsonString) as T;
  } catch (err: any) {
    const errorMsg = err.message || "Unknown error";
    console.error(`[AI] Échec parsing JSON (${errorMsg})`);
    console.log(`[AI] Longueur texte : ${text.length} caractères`);
    console.log(`[AI] Fin du texte : "...${text.slice(-200)}"`);
    
    try {
      const cleaned = jsonString.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
      return JSON.parse(cleaned) as T;
    } catch (finalErr) {
      throw new Error(`Erreur de format IA (JSON invalide ou tronqué). Longueur: ${text.length}`);
    }
  }
}
