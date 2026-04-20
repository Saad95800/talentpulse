import prisma from '@/lib/prisma';
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
  score: number;
  competences_validees: string[];
  competences_manquantes: string[];
  argumentaire_client: string;
  questions_candidat: string[];
  candidateInfo: CandidateInfo;
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
      } catch (fallbackError) {
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

export async function extractCandidateInfo(
  cvText: string,
  cvFileData?: { buffer: Buffer, mimeType: string, isScanned: boolean }
): Promise<CandidateInfo> {
  const systemPrompt = `Tu es un expert en extraction de données RH. Ton rôle est d'extraire le profil COMPLET d'un candidat.
SOIS EXTRÊMEMENT CONCIS.
RETORNE UN OBJET JSON STRICT SUIVANT LE SCHÉMA FOURNI.`;

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
  
  return extractJSON<CandidateInfo>(rawText);
}

export async function generateMatchingScore(
  jobText: string, 
  cvText: string,
  existingInfo?: CandidateInfo
): Promise<MatchResult> {
  const systemPrompt = `Tu es une IA experte en recrutement. Analyse le matching poste/candidat.
SOIS EXTRÊMEMENT CONCIS.
RETOUNE UN OBJET JSON STRICT.`;

  const userPrompt = `FICHE DE POSTE :\n${jobText}\n\nCANDIDAT :\n${existingInfo ? JSON.stringify(existingInfo) : cvText}\n\nAnalyse le matching.`;

  const provider = await getAIProvider('matching');
  const options = { 
    system: systemPrompt, 
    maxTokens: 12000, 
    temperature: 0, 
    json: true,
    schema: matchResultSchema
  };
  
  const rawText = await provider.complete([{ role: 'user', content: userPrompt }], options);
  return extractJSON<MatchResult>(rawText);
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
