import prisma from '@/lib/prisma';
import * as Sentry from "@sentry/nextjs";
import type { AIProviderName, IAIProvider, AIMessage, AICompletionOptions } from './types';
import { AI_PROVIDERS_CONFIG } from './types';
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider }    from './providers/openai';
import { GeminiProvider }    from './providers/gemini';

export type { AIMessage, AICompletionOptions, AIProviderName, IAIProvider } from './types';
export { AI_PROVIDERS_CONFIG } from './types';

// --- Interfaces ---

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
  recordId?: string;
  score: number;
  competences_validees: string[];
  competences_manquantes: string[];
  argumentaire_client: string;
  questions_candidat: string[];
  candidateInfo: CandidateInfo;
  jobTitle?: string;
  jobDescription?: string;
  fullCandidate?: unknown;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

// --- Logic ---

export async function getActiveProviderName(): Promise<AIProviderName> {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { key: 'ai_provider' },
    });
    if (setting && isValidProvider(setting.value)) {
      return setting.value as AIProviderName;
    }
  } catch {
  }

  const envProvider = process.env.AI_PROVIDER;
  if (envProvider && isValidProvider(envProvider)) {
    return envProvider as AIProviderName;
  }

  return 'gemini';
}

function isValidProvider(value: string): value is AIProviderName {
  return ['anthropic', 'openai', 'gemini'].includes(value);
}

export type ModelUsage = 'fast' | 'main' | 'matching';

export async function getAIProvider(usage: ModelUsage = 'main'): Promise<IAIProvider> {
  const providerName = await getActiveProviderName();
  return createProvider(providerName, usage);
}

export function createProvider(
  providerName: AIProviderName,
  usage: ModelUsage = 'main'
): IAIProvider {
  const config = AI_PROVIDERS_CONFIG[providerName];
  const model  = config.models[usage];

  switch (providerName) {
    case 'anthropic': return new AnthropicProvider(model);
    case 'openai':    return new OpenAIProvider(model);
    case 'gemini':    return new GeminiProvider(model);
  }
}

export async function aiComplete(
  messages:  AIMessage[],
  options?:  AICompletionOptions,
  usage:     ModelUsage = 'main'
): Promise<string> {
  try {
    const provider = await getAIProvider(usage);
    return await provider.complete(messages, options);
  } catch (error) {
    const msg    = error instanceof Error ? error.message : '';
    // @ts-expect-error - error can have status from provider
    const status = error?.status  ?? 0;

    const isTransient =
      status === 529 ||
      status === 404 ||
      status === 503 ||
      msg.includes('overloaded') ||
      msg.includes('not_found')  ||
      msg.includes('unavailable');

    if (isTransient && process.env.GEMINI_API_KEY) {
      console.warn(`[AI Global Fallback] Provider indisponible. Bascule sur Gemini...`);
      try {
        const geminiProvider = createProvider('gemini', usage);
        return await geminiProvider.complete(messages, options);
      } catch (_fallbackError) {
        throw new Error("L'assistant IA est temporairement indisponible.");
      }
    }
    throw error;
  }
}

// --- Match Logic (Moved from ai.ts) ---

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

const jobTitleSchema = {
  type: "object",
  properties: {
    title: { type: "string" }
  },
  required: ["title"]
};

export async function generateJobTitle(jobText: string): Promise<string> {
  // Sécurité si texte trop court
  if (!jobText || jobText.trim().length < 15) {
    return "Mission sans titre";
  }

  const systemPrompt = `Tu es un expert en recrutement. Ton rôle est d'extraire un titre de poste PROFESSIONNEL et TRÈS CONCIS.
RÈGLES :
- MAXIMUM 4-5 MOTS.
- Pas de ponctuation à la fin.
- Capitalise chaque mot important.
- Exemple : "Expert Cybersécurité Senior", "Développeur React Native", "Chef de Projet Marketing".
- Retourne uniquement le JSON demandé.`;

  const userPrompt = `Analyse cette fiche de poste et génère uniquement le titre :\n\n${jobText.substring(0, 4000)}`;

  try {
    const provider = await getAIProvider('fast');
    const options = { 
      system: systemPrompt, 
      maxTokens: 50, 
      temperature: 0.1, 
      json: true, 
      schema: jobTitleSchema 
    };

    const rawText = await provider.complete([{ role: 'user', content: userPrompt }], options);
    const data = extractJSON<{ title: string }>(rawText);
    
    if (data.title && data.title.length > 2) {
      return data.title.trim();
    }
    
    throw new Error("Titre vide reçu de l'IA");
  } catch (error) {
    console.warn("[generateJobTitle] Échec, repli sur l'extraction manuelle.", error);
    
    // Repli : première ligne non vide ou 6 premiers mots
    const lines = jobText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    const fallbackText = lines[0] || jobText.trim();
    const words = fallbackText.split(/\s+/).slice(0, 6).join(' ');
    
    return words || "Nouvelle Mission";
  }
}

export async function extractCandidateInfo(
  cvText: string,
  cvFileData?: { buffer: Buffer, mimeType: string, isScanned: boolean }
): Promise<CandidateInfo> {
  const systemPrompt = `Tu es un expert en extraction de données RH spécialisé dans les CV français et internationaux.
Ton rôle est d'extraire le profil COMPLET d'un candidat avec une rigueur absolue.

CONSIGNES CRITIQUES POUR L'IDENTITÉ :
1. NE JAMAIS INVENTER D'IDENTITÉ. INTERDICTION FORMELLE d'utiliser des noms de substitution comme "Jean-Baptiste LOUVET", "John Doe" ou "Dupont".
2. Recherche le Prénom et le NOM au tout début du document (bandeau, en-tête). Le NOM est souvent en MAJUSCULES (ex: Saad RAJRAJI).
3. Si le nom est illisible (ex: scan de mauvaise qualité), retourne une chaîne vide "" ou "Non spécifié".
4. Ne confonds pas le nom avec un titre de poste (ex: DÉVELOPPEUR) ou une entreprise.

INSTRUCTIONS DE SORTIE :
- Réponse au format JSON pur uniquement.
- Sois exhaustif sur les compétences, expériences et formations.`;

  const userPrompt = cvFileData?.isScanned 
    ? "Extrais le profil depuis ce document joint." 
    : `Extrais le profil depuis ce texte :\n${cvText}`;

  const provider = createProvider('gemini', 'matching') as IAIProvider;
  const options = { 
    system: systemPrompt, 
    maxTokens: 20000, 
    temperature: 0, 
    json: true,
    schema: candidateInfoSchema
  };
  
  let rawText: string;
  if (cvFileData?.isScanned && provider.completeWithDocument) {
    rawText = await provider.completeWithDocument(cvText, cvFileData.buffer, cvFileData.mimeType, options);
  } else {
    rawText = await provider.complete([{ role: 'user', content: userPrompt }], options);
  }
  
  const info = extractJSON<CandidateInfo>(rawText);

  // Nettoyage de sécurité pour les hallucinations de l'IA (Non spécifié, etc.)
  const forbidden = ["non spécifié", "n/a", "inconnu", "not specified", "unknown"];
  if (info.lastName && forbidden.includes(info.lastName.toLowerCase())) {
    info.lastName = "";
  }
  if (info.firstName && forbidden.includes(info.firstName.toLowerCase())) {
    info.firstName = "";
  }

  return info;
}

export async function generateMatchingScore(
  jobText: string, 
  cvText: string,
  existingInfo?: CandidateInfo
): Promise<MatchResult> {
  const systemPrompt = `Tu es une IA experte en recrutement senior (Headhunter). 
Ton rôle est de fournir une ANALYSE CRITIQUE et PRÉCISE du matching entre une offre d'emploi et un candidat.

CONSIGNES DE RÉDACTION :
1. SCORE (score) : Entre 0 et 100. Sois exigeant. Un 100% est quasi impossible.
2. COMPÉTENCES VALIDÉES (competences_validees) : Liste uniquement ce qui est explicitement prouvé.
3. COMPÉTENCES MANQUANTES (competences_manquantes) : Identifie les "red flags" ou manques réels par rapport à l'offre.
4. ARGUMENTAIRE CLIENT (argumentaire_client) : Rédige un texte de 3-5 phrases professionnelles résumant le verdict. 
   - NE RESTE PAS VAGUE. 
   - "Le candidat match bien" est interdit. Préfère "L'expertise technique en React est solide, mais l'absence d'expérience en management sur de gros volumes est un risque."
5. QUESTIONS (questions_candidat) : 3 questions pièges ou pertinentes à poser en entretien pour lever les doutes.

OBLIGATION : 
- Si tu ne peux pas analyser le candidat (données illisibles), retourne un score de 0 mais EXPLIQUE POURQUOI dans l'argumentaire.
- NE RETOURNE JAMAIS DE STRINGS VIDES.
- RÉPONDS UNIQUEMENT EN JSON STRICT.`;

  const userPrompt = `### FICHE DE POSTE\n${jobText}\n\n### PROFIL CANDIDAT\n${existingInfo ? JSON.stringify(existingInfo) : cvText}\n\nEffectue l'analyse de matching maintenant.`;

  const provider = await getAIProvider('matching');
  const options = { 
    system: systemPrompt, 
    maxTokens: 12000, 
    temperature: 0, 
    json: true,
    schema: matchResultSchema
  };
  
  const rawText = await provider.complete([{ role: 'user', content: userPrompt }], options);
  const result = extractJSON<MatchResult>(rawText);

  // Validation Layer: Detect anomalies (Lazy AI or silent failure)
  const isEmpty = !result.argumentaire_client || result.argumentaire_client.trim().length < 10;
  
  if (isEmpty) {
    const errorMsg = "L'IA a renvoyé une analyse vide ou insuffisante.";
    Sentry.captureMessage(errorMsg, {
      level: 'warning',
      extra: { rawText, result, userId: "matching_system" }
    });
    throw new Error(errorMsg);
  }

  return result;
}

export async function validateDocumentConformity(
  text: string, 
  type: 'cv' | 'job',
  fileData?: { buffer: Buffer, mimeType: string, isScanned: boolean }
): Promise<{ isConform: boolean; reason: string }> {
  const systemPrompt = `Vérifie si le document est un ${type === 'cv' ? 'CV' : 'Offre d\'emploi'}.`;
  const userPrompt = fileData?.isScanned ? "Analyse le document joint." : text.substring(0, 5000);

  const provider = createProvider('gemini', 'matching') as IAIProvider;
  const options = { system: systemPrompt, maxTokens: 1000, temperature: 0, json: true, schema: conformitySchema };

  try {
    const rawText = fileData?.isScanned && provider.completeWithDocument
      ? await provider.completeWithDocument(text, fileData.buffer, fileData.mimeType, options)
      : await provider.complete([{ role: 'user', content: userPrompt }], options);
    
    return extractJSON<{ isConform: boolean; reason: string }>(rawText);
  } catch {
    return { isConform: true, reason: "" };
  }
}

export function extractJSON<T>(text: string): T {
  let jsonString = text.trim();
  const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (markdownMatch && markdownMatch[1]) {
    jsonString = markdownMatch[1].trim();
  }
  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(jsonString) as T;
}
