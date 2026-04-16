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
  jobDescription?: string;
  fullCandidate?: any; // Objet Candidate complet de la DB
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
SOIS EXTRÊMEMENT CONCIS (Synthèse des missions en 1 ou 2 phrases maximum par expérience). 
NE RÉPÈTE PAS tout le contenu du CV. Va droit à l'essentiel.
${cvFileData?.isScanned ? "ATTENTION: Utilisez vos capacités de vision pour compléter les données manquantes." : ""}

RETOURNE UN OBJET JSON STRICT SUIVANT LE SCHÉMA FOURNI.`;

  const userPrompt = cvFileData?.isScanned 
    ? "Extrais le profil depuis ce document joint." 
    : `Extrais le profil depuis ce texte :\n${cvText}`;

  const provider = createProvider('gemini', 'matching');
  const options = { 
    system: systemPrompt, 
    maxTokens: 32000, // Large marge pour les CV extrêmement denses (ex: Seniors avec bcp de texte)
    temperature: 0, 
    json: true,
    schema: candidateInfoSchema // Forçage du schéma natif
  };
  
  const extractionStartTime = Date.now();
  let rawText: string;
  try {
    if (cvFileData?.isScanned && (provider as any).completeWithDocument) {
      rawText = await (provider as any).completeWithDocument(cvText, cvFileData.buffer, cvFileData.mimeType, options);
    } else {
      rawText = await provider.complete([{ role: 'user', content: userPrompt }], options);
    }

    const duration = Date.now() - extractionStartTime;
    console.log(`[AI:Extraction] Step 1 réussi en ${duration}ms${duration > 60000 ? " (Traitement Lourd)" : ""}`);

    if (!rawText) throw new Error("Réponse de l'IA vide.");
    
    return extractJSON<CandidateInfo>(rawText);
  } catch (error: any) {
    const duration = Date.now() - extractionStartTime;
    console.error(`[AI:Extraction] Échec Step 1 après ${duration}ms:`, error.message);
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
  const systemPrompt = `Tu es une IA experte en recrutement. Analyse le matching poste/candidat.
SOIS TRÈS CONCIS. Ne dépasse pas 1000 mots au total pour l'argumentaire.
RETOURNE UN OBJET JSON STRICT.

Structure "argumentaire_client" (Titres en MAJUSCULES) :
1. ANALYSE GLOBALE (Synthèse rapide)
2. POINTS DE FORCE (Tirets "- ")
3. POINTS DE VIGILANCE (Tirets "- ")
4. VERDICT (Recommandation finale)

IMPORTANT: Le champ "score" doit être entre 0 et 100.`;

  const userPrompt = `FICHE DE POSTE :\n${jobText}\n\nCANDIDAT :\n${existingInfo ? JSON.stringify(existingInfo) : cvText}\n\nAnalyse le matching.`;

  const provider = await getAIProvider('matching');
  const options = { 
    system: systemPrompt, 
    maxTokens: 16000, // Réduit pour encourager la concision et éviter les truncations
    temperature: 0, 
    json: true,
    schema: matchResultSchema
  };
  
  const matchingStartTime = Date.now();
  const rawText = await provider.complete([{ role: 'user', content: userPrompt }], options);
  const duration = Date.now() - matchingStartTime;
  console.log(`[AI:Matching] Step 2 réussi en ${duration}ms`);

  return extractJSON<MatchResult>(rawText);
}

function extractJSON<T>(text: string): T {
  let jsonString = text.trim();
  
  // Étape 1 : Nettoyage de base (Markdown blocks)
  if (jsonString.startsWith('```')) {
    const lines = jsonString.split('\n');
    if (lines[0].startsWith('```json')) lines.shift();
    if (lines[lines.length-1].startsWith('```')) lines.pop();
    jsonString = lines.join('\n').trim();
  }

  // Étape 2 : Extraction de la première structure JSON valide (accolades)
  const firstBrace = jsonString.indexOf('{');
  if (firstBrace === -1) throw new Error("Aucune structure JSON détectée.");
  
  // On ne cherche PAS le lastBrace car s'il est tronqué, il n'y en a pas
  jsonString = jsonString.substring(firstBrace);

  try {
    return JSON.parse(jsonString) as T;
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[AI:JSON_PARSE_ERROR] Tentative de réparation... Erreur initiale: ${errorMsg}`);
    
    // TENTATIVE DE RÉPARATION AVANCÉE
    let repaired = jsonString.trim();

    // 1. Fermeture des chaînes de caractères (Guillemets impairs)
    const quoteCount = (repaired.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      repaired += '"';
    }

    // 2. Équilibrage des Accolades et Crochets
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      repaired += "}".repeat(openBraces - closeBraces);
    }

    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      repaired += "]".repeat(openBrackets - closeBrackets);
    }

    // 3. Suppression des virgules traînantes invalides causées par la truncation
    repaired = repaired.replace(/,\s*[}\]]$/, (match) => match.replace(',', ''));

    try {
      return JSON.parse(repaired) as T;
    } catch (finalErr: any) {
      console.error(`[AI:REPAIR_FAILED] Échec final. Longueur: ${text.length}.`);
      console.log(`[AI:DEBUG] Fin du flux: "...${repaired.slice(-100)}"`);
      throw new Error(`Échec critique du formatage IA. Longueur: ${text.length}. Erreur: ${finalErr.message}`);
    }
  }
}
