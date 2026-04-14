import prisma from '@/lib/prisma';
import type { AIProviderName, IAIProvider, AIMessage, AICompletionOptions } from './types';
import { AI_PROVIDERS_CONFIG } from './types';
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider }    from './providers/openai';
import { GeminiProvider }    from './providers/gemini';

export type { AIMessage, AICompletionOptions, AIProviderName, IAIProvider } from './types';
export { AI_PROVIDERS_CONFIG } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Lit le provider actif depuis la base de données
// Fallback sur la variable d'environnement AI_PROVIDER, puis 'gemini'
// ─────────────────────────────────────────────────────────────────────────────

export async function getActiveProviderName(): Promise<AIProviderName> {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { key: 'ai_provider' },
    });
    if (setting && isValidProvider(setting.value)) {
      return setting.value as AIProviderName;
    }
  } catch {
    // Si la DB n'est pas accessible, on utilise l'env
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

// ─────────────────────────────────────────────────────────────────────────────
// Instancie le bon provider avec le bon modèle selon l'usage
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Raccourci : complétion directe avec Fallback Automatique
// ─────────────────────────────────────────────────────────────────────────────

export async function aiComplete(
  messages:  AIMessage[],
  options?:  AICompletionOptions,
  usage:     ModelUsage = 'main'
): Promise<string> {
  // 1. Essayer avec le provider par défaut
  try {
    const provider = await getAIProvider(usage);
    return await provider.complete(messages, options);
  } catch (error) {
    const msg    = error instanceof Error ? error.message : '';
    // @ts-expect-error - error can have status from provider
    const status = error?.status  ?? 0;

    // Détection des erreurs transitoires (Surcharge, Modèle introuvable ou Service indisponible)
    const isTransient =
      status === 529 ||
      status === 404 ||
      status === 503 ||
      msg.includes('overloaded') ||
      msg.includes('not_found')  ||
      msg.includes('unavailable');

    // 2. Fallback sur Gemini si le provider principal échoue
    if (isTransient && process.env.GEMINI_API_KEY) {
      console.warn(`[AI Global Fallback] Provider indisponible (${status || msg.slice(0, 50)}). Bascule sur Gemini...`);
      try {
        const geminiProvider = createProvider('gemini', usage);
        return await geminiProvider.complete(messages, options);
      } catch (fallbackError) {
        console.error("[AI Global Fallback] Échec du fallback Gemini:", fallbackError);
        throw new Error("L'assistant IA est temporairement indisponible. Veuillez réessayer dans quelques instants.");
      }
    }

    // Erreur persistante (auth, quota épuisé) : on propage l'erreur originale
    throw error;
  }
}
