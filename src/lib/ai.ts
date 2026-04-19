import { getAIProvider, createProvider, type IAIProvider } from '@/lib/ai/index';

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
  questions_candidat: string[];
  candidateInfo: CandidateInfo;
  jobDescription?: string;
  fullCandidate?: unknown; // Objet Candidate complet de la DB
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
    argumentaire_client: { type: "string" },
    questions_candidat: { type: "array", items: { type: "string" } }
  },
  required: ["score", "competences_validees", "competences_manquantes", "argumentaire_client", "questions_candidat"]
};

const conformitySchema = {
  type: "object",
  properties: {
    isConform: { type: "boolean" },
    reason: { type: "string" }
  },
  required: ["isConform", "reason"]
};
/**
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

  const provider = createProvider('gemini', 'matching') as IAIProvider;
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
    if (cvFileData?.isScanned && provider.completeWithDocument) {
      rawText = await provider.completeWithDocument(cvText, cvFileData.buffer, cvFileData.mimeType, options);
    } else {
      rawText = await provider.complete([{ role: 'user', content: userPrompt }], options);
    }

    const duration = Date.now() - extractionStartTime;
    console.log(`[AI:Extraction] Step 1 réussi en ${duration}ms`);

    if (!rawText) throw new Error("Réponse de l'IA vide.");
    
    return extractJSON<CandidateInfo>(rawText);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const duration = Date.now() - extractionStartTime;
    console.error(`[AI:Extraction] Échec Step 1 après ${duration}ms:`, errorMsg);
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

IMPORTANT: Le champ "score" doit être entre 0 et 100.
IMPORTANT: Le champ "questions_candidat" doit contenir 3 à 5 questions ultra-pertinentes pour vérifier la qualification réelle du candidat par rapport aux exigences critiques du poste. Retourne uniquement les questions dans un tableau de chaînes de caractères.`;

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

/**
 * ÉTAPE 0 : Validation de la conformité du document
 * Vérifie si le texte correspond bien à un CV ou à une Fiche de Poste.
 */
export async function validateDocumentConformity(
  text: string, 
  type: 'cv' | 'job',
  fileData?: { buffer: Buffer, mimeType: string, isScanned: boolean }
): Promise<{ isConform: boolean; reason: string }> {
  const systemPrompt = `Tu es un expert en analyse de documents RH. 
Ton rôle est de vérifier si le document fourni est BIEN un(e) ${type === 'cv' ? 'Curriculum Vitae (CV)' : 'Fiche de Poste (Offre d\'emploi)'}.

Critères pour un CV : Présence de nom/prénom, expériences professionnelles, formations ou compétences.
Critères pour une Fiche de Poste : Présence d'un titre de poste, missions, profil recherché ou présentation d'entreprise.

${fileData?.isScanned ? "ATTENTION: Le document est un scan/image. Utilisez vos capacités de vision pour valider." : ""}

RETOURNE UN OBJET JSON STRICT :
{
  "isConform": boolean,
  "reason": "Une explication courte et professionnelle en français si isConform est false, sinon null"
}`;

  const userPrompt = fileData?.isScanned 
    ? `Analyse ce document joint et détermine s'il s'agit d'un ${type === 'cv' ? 'CV' : 'Offre d\'emploi'} valide.`
    : `Analyse ce texte et détermine s'il s'agit d'un ${type === 'cv' ? 'CV' : 'Offre d\'emploi'} valide :\n\n${text.substring(0, 5000)}`;

  const provider = createProvider('gemini', 'matching') as IAIProvider;
  const options = { 
    system: systemPrompt, 
    maxTokens: 1000, 
    temperature: 0, 
    json: true,
    schema: conformitySchema
  };

  try {
    let rawText: string;
    if (fileData?.isScanned && provider.completeWithDocument) {
      rawText = await provider.completeWithDocument(text, fileData.buffer, fileData.mimeType, options);
    } else {
      rawText = await provider.complete([{ role: 'user', content: userPrompt }], options);
    }
    
    if (!rawText) throw new Error("Réponse de validation vide.");
    
    return extractJSON<{ isConform: boolean; reason: string }>(rawText);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[AI:Validation] Échec de conformité ${type}:`, errorMsg);
    // En cas d'échec technique de l'IA, on laisse passer par défaut pour ne pas bloquer l'utilisateur
    return { isConform: true, reason: "" };
  }
}

export function extractJSON<T>(text: string): T {
  let jsonString = text.trim();
  
  // Étape 1 : Extraction du bloc Markdown JSON si présent
  // Utilise un regex non-gourmand pour capturer le contenu entre ```json et ``` ou ``` et ```
  const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (markdownMatch && markdownMatch[1]) {
    jsonString = markdownMatch[1].trim();
  }

  // Étape 2 : Si après nettoyage markdown on a encore du texte autour des accolades (ex: "Voici le JSON: {...}")
  // On cherche la première accolade ouvrante et la dernière fermante
  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
  } else {
    // Si pas d'accolades, on vérifie les crochets (pour les tableaux)
    const firstBracket = jsonString.indexOf('[');
    const lastBracket = jsonString.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      jsonString = jsonString.substring(firstBracket, lastBracket + 1);
    }
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (err: unknown) {
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
    } catch (finalErr: unknown) {
      const finalErrorMsg = finalErr instanceof Error ? finalErr.message : String(finalErr);
      console.error(`[AI:REPAIR_FAILED] Échec final. Longueur: ${text.length}.`);
      console.log(`[AI:DEBUG] Fin du flux après réparation: "...${repaired.slice(-100)}"`);
      throw new Error(`Échec critique du formatage IA. Longueur: ${text.length}. Erreur: ${finalErrorMsg}`);
    }
  }
}
