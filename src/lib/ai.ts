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
}/**
 * ÉTAPE 1 : Extraction pure du profil candidat
 */
export async function extractCandidateInfo(
  cvText: string,
  cvFileData?: { buffer: Buffer, mimeType: string, isScanned: boolean }
): Promise<CandidateInfo> {
  const systemPrompt = `Tu es un expert en extraction de données RH. Ton rôle est d'extraire le profil COMPLET d'un candidat.
SOIS EXTRÊMEMENT CONCIS. 
- Pour chaque expérience : 1 seule phrase de synthèse maximum.
- Ne répète pas les détails inutiles.
- Garde uniquement les compétences et mots-clés essentiels.
${cvFileData?.isScanned ? "ATTENTION: Utilisez vos capacités de vision pour compléter les données manquantes." : ""}

RETOURNE UN OBJET JSON STRICT SUIVANT LE SCHÉMA FOURNI.`;

  const userPrompt = cvFileData?.isScanned 
    ? "Extrais le profil depuis ce document joint." 
    : `Extrais le profil depuis ce texte :\n${cvText}`;

  const provider = createProvider('gemini', 'matching');
  const options = { 
    system: systemPrompt, 
    maxTokens: 20000, // Réduit pour forcer la concision
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
    console.log(`[AI:Extraction] Step 1 réussi en ${duration}ms`);

    if (!rawText) throw new Error("Réponse de l'IA vide.");
    
    return extractJSON<CandidateInfo>(rawText);
  } catch (error: any) {
    const duration = Date.now() - extractionStartTime;
    console.error(`[AI:Extraction] Échec Step 1 après ${duration}ms:`, error.message);
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
SOIS EXTRÊMEMENT CONCIS. Ne dépasse pas 800 mots au total.
RETOURNE UN OBJET JSON STRICT.

Structure "argumentaire_client" (Titres en MAJUSCULES) :
1. ANALYSE GLOBALE (Synthèse en 2 phrases)
2. POINTS DE FORCE (3 à 5 tirets "- ")
3. POINTS DE VIGILANCE (2 à 3 tirets "- ")
4. VERDICT (1 phrase de recommandation)

IMPORTANT: Le champ "score" doit être entre 0 et 100.`;

  const userPrompt = `FICHE DE POSTE :\n${jobText}\n\nCANDIDAT :\n${existingInfo ? JSON.stringify(existingInfo) : cvText}\n\nAnalyse le matching.`;

  const provider = await getAIProvider('matching');
  const options = { 
    system: systemPrompt, 
    maxTokens: 12000, // Réduit pour forcer la concision
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
  
  jsonString = jsonString.substring(firstBrace);

  try {
    return JSON.parse(jsonString) as T;
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[AI:JSON_PARSE_ERROR] Tentative de réparation... Erreur initiale: ${errorMsg}`);
    
    // TENTATIVE DE RÉPARATION AVANCÉE
    let repaired = jsonString.trim();

    // 0. Si l'erreur est "Unterminated string", on ajoute une quote de fin
    // Souvent, la truncation arrive au milieu d'une valeur de string
    if (errorMsg.toLowerCase().includes('unterminated string')) {
      // On cherche si le dernier guillemet est ouvert
      const lastQuote = repaired.lastIndexOf('"');
      const lastEscape = repaired.lastIndexOf('\\');
      
      // Si le dernier guillemet n'est pas échappé et qu'il semble être le début d'une valeur
      if (lastQuote !== -1 && lastQuote !== lastEscape + 1) {
        repaired += '"';
      }
    }

    // 1. Équilibrage global des guillemets (si pas déjà fait par le check spécifique au-dessus)
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

    // 3. Suppression des virgules traînantes invalides causées par la truncation ou l'ajout de fermetures
    // On nettoie les ,} ou ,] qui sont fréquents après réparation
    repaired = repaired.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

    try {
      return JSON.parse(repaired) as T;
    } catch (finalErr: any) {
      console.error(`[AI:REPAIR_FAILED] Échec final. Longueur: ${text.length}.`);
      console.log(`[AI:DEBUG] Fin du flux après réparation: "...${repaired.slice(-100)}"`);
      throw new Error(`Échec critique du formatage IA. Longueur: ${text.length}. Erreur: ${finalErr.message}`);
    }
  }
}
