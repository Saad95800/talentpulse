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
 * ÉTAPE 1 : Extraction pure du profil candidat (Utilise Gemini Flash par défaut pour la vitesse/coût)
 * Sert d'OCR intelligent et de constructeur de profil.
 */
export async function extractCandidateInfo(
  cvText: string,
  cvFileData?: { buffer: Buffer, mimeType: string, isScanned: boolean }
): Promise<CandidateInfo> {
  const systemPrompt = `Tu es un expert en extraction de données RH. Ton rôle est d'extraire le profil COMPLET d'un candidat à partir d'un CV.
${cvFileData?.isScanned ? "ATTENTION: Le document est un SCAN/IMAGE. Utilise tes capacités de vision pour extraire les données." : ""}

TU DOIS RETOURNER UN JSON STRICT :
{
  "firstName": string,
  "lastName": string,
  "email": string,
  "phone": string,
  "address": string,
  "linkedin": string,
  "website": string,
  "summary": string,
  "languages": string[],
  "skills": string[],
  "experiences": [{ "company": string, "position": string, "period": string, "description": string }],
  "educations": [{ "school": string, "degree": string, "year": string }]
}`;

  const userPrompt = cvFileData?.isScanned 
    ? "Extrais le profil depuis ce document joint." 
    : `Extrais le profil depuis ce texte :\n${cvText}`;

  // On force Gemini pour cette étape d'OCR car il est imbattable en rapport Vitesse/Coût/Vision
  const provider = createProvider('gemini', 'matching');
  const options = { system: systemPrompt, maxTokens: 2000, temperature: 0 };
  
  let rawText: string;
  if (cvFileData) {
    rawText = await provider.completeWithDocument(cvText, cvFileData.buffer, cvFileData.mimeType, options);
  } else {
    rawText = await provider.complete([{ role: 'user', content: userPrompt }], options);
  }

  return extractJSON<CandidateInfo>(rawText);
}

/**
 * ÉTAPE 2 : Analyse de Matching (Peut utiliser un modèle plus "réflexif" comme Claude)
 */
export async function generateMatchingScore(
  jobText: string, 
  cvText: string,
  existingInfo?: CandidateInfo
): Promise<MatchResult> {
  const systemPrompt = `Tu es un expert en recrutement Senior. Ton rôle est d'analyser le matching entre un poste et un candidat.
Sois précis, critique et objectif. Ton argumentaire doit aider un recruteur à décider.

RETOURNE UN JSON :
{
  "score": number (0-100),
  "competences_validees": string[],
  "competences_manquantes": string[],
  "argumentaire_client": string
}`;

  const userPrompt = `FICHE DE POSTE :\n${jobText}\n\nCANDIDAT :\n${existingInfo ? JSON.stringify(existingInfo) : cvText}\n\nAnalyse le matching.`;

  const provider = await getAIProvider('matching');
  const options = { system: systemPrompt, maxTokens: 2000, temperature: 0 };
  const rawText = await provider.complete([{ role: 'user', content: userPrompt }], options);
  
  const matchParts = extractJSON<{score: number, competences_validees: string[], competences_manquantes: string[], argumentaire_client: string}>(rawText);
  
  return {
    ...matchParts,
    candidateInfo: existingInfo || { firstName: "Inconnu", lastName: "Inconnu" } // Fallback si pas d'info
  };
}

function extractJSON<T>(text: string): T {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    let jsonString = match ? match[1].trim() : text.trim();
    
    const firstBrace = jsonString.indexOf('{');
    const lastBrace  = jsonString.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(jsonString) as T;
  } catch (err) {
    console.error("[AI] Échec extraction JSON:", text);
    throw new Error("Erreur de format IA (JSON attendu).");
  }
}
