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
SOIS CONCIS dans les descriptions d'expériences (synthèse des missions).
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
    if (cvFileData?.isScanned) {
      rawText = await provider.completeWithDocument(cvText, cvFileData.buffer, cvFileData.mimeType, options);
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
  const systemPrompt = `Tu es une IA experte en recrutement de haut niveau. Ton rôle est d'analyser le matching entre un poste et un candidat.
SOIS PRÉCIS, CRITIQUE ET CONSTRUCTIF.

RETOURNE UN OBJET JSON STRICT SUIVANT LE SCHÉMA FOURNI.

CONSIGNES POUR "argumentaire_client" :
Structure obligatoirement ta réponse avec ces sections (utilise des titres en MAJUSCULES) :
1. ANALYSE GLOBALE : Une synthèse du profil.
2. POINTS DE FORCE : Ce qui fait du candidat un match idéal (utilise des tirets "- ").
3. POINTS DE VIGILANCE : Les manques ou risques potentiels (utilise des tirets "- ").
4. VERDICT : Ta recommandation finale justifiée.

Utilise des doubles retours à la ligne (\\n\\n) entre chaque section pour la lisibilité.
IMPORTANT: Le champ "score" doit être un nombre entier ou décimal entre 0 et 100.`;

  const userPrompt = `FICHE DE POSTE :\n${jobText}\n\nCANDIDAT :\n${existingInfo ? JSON.stringify(existingInfo) : cvText}\n\nAnalyse le matching.`;

  const provider = await getAIProvider('matching');
  const options = { 
    system: systemPrompt, 
    maxTokens: 32000, // Aucun compromis sur la longueur de l'analyse pour les cas complexes
    temperature: 0, 
    json: true,
    schema: matchResultSchema // Forçage du schéma natif
  };
  
  const matchingStartTime = Date.now();
  const rawText = await provider.complete([{ role: 'user', content: userPrompt }], options);
  const duration = Date.now() - matchingStartTime;
  console.log(`[AI:Matching] Step 2 réussi en ${duration}ms`);

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
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[AI:JSON_PARSE_ERROR] ${errorMsg}`);
    console.log(`[AI:DEBUG] Taille brute: ${text.length} chars. Fin du flux: "...${text.slice(-100)}"`);
    
    // TENTATIVE DE RÉPARATION 1 : Nettoyage des caractères de contrôle
    try {
      const cleaned = jsonString.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
      return JSON.parse(cleaned) as T;
    } catch (retryErr) {
      // TENTATIVE DE RÉPARATION 2 : Correction de truncation basique (balancement des accolades)
      try {
        let repaired = jsonString.trim();
        const openBraces = (repaired.match(/\{/g) || []).length;
        const closeBraces = (repaired.match(/\}/g) || []).length;
        
        if (openBraces > closeBraces) {
          console.warn(`[AI:REPAIR] Détection de JSON tronqué (${openBraces} { vs ${closeBraces} }). Tentative de fermeture forcée.`);
          repaired += "}".repeat(openBraces - closeBraces);
          return JSON.parse(repaired) as T;
        }
      } catch (failingRepair) {
        // Si tout échoue
      }

      throw new Error(`Échec critique du formatage IA. Longueur: ${text.length}. Erreur: ${errorMsg}`);
    }
  }
}
