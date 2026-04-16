// ─────────────────────────────────────────────────────────────────────────────
// Types partagés pour la couche d'abstraction IA
// ─────────────────────────────────────────────────────────────────────────────

export type AIProviderName = 'anthropic' | 'openai' | 'gemini';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  maxTokens?:   number;
  temperature?: number;
  system?:      string;
  json?:        boolean; // Indique si on veut un retour JSON pur
  schema?:      any;     // Optionnel : schéma JSON pour forcer la structure
}

export interface AIProviderConfig {
  name:        AIProviderName;
  label:       string;
  description: string;
  models: {
    fast:     string;
    main:     string;
    matching: string;
  };
  envKey:  string;
  website: string;
  pros:    string[];
  cons:    string[];
}

// Interface que chaque provider doit implémenter
export interface IAIProvider {
  complete(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<string>;

  completeWithDocument?(
    text:      string,
    buffer:    Buffer,
    mimeType:  string,
    options?:  AICompletionOptions
  ): Promise<string>;
}

// Catalogue statique des providers disponibles
export const AI_PROVIDERS_CONFIG: Record<AIProviderName, AIProviderConfig> = {
  gemini: {
    name:        'gemini',
    label:       'Google Gemini',
    description: 'Modèle de Google. Excellent rapport qualité/prix, idéal pour une utilisation intensive.',
    models: {
      fast:     'gemini-2.5-flash',
      main:     'gemini-2.5-flash',
      matching: 'gemini-2.5-flash',
    },
    envKey:  'GEMINI_API_KEY',
    website: 'https://aistudio.google.com',
    pros:    ['Très économique', 'Quota gratuit généreux', 'Rapide'],
    cons:    ['Moins précis que GPT-4o ou Claude pour les tâches complexes'],
  },
  anthropic: {
    name:        'anthropic',
    label:       'Anthropic Claude',
    description: 'Modèle Claude d\'Anthropic. Excellent pour le raisonnement et les tâches structurées.',
    models: {
      fast:     'claude-sonnet-4-6',
      main:     'claude-sonnet-4-6',
      matching: 'claude-sonnet-4-6',
    },
    envKey:  'ANTHROPIC_API_KEY',
    website: 'https://console.anthropic.com',
    pros:    ['Très bon raisonnement', 'Excellent suivi d\'instructions', 'Support PDF natif'],
    cons:    ['Limite de tokens/min sur les petits plans', 'Plus coûteux'],
  },
  openai: {
    name:        'openai',
    label:       'OpenAI GPT',
    description: 'Modèles GPT d\'OpenAI. Référence du marché, très polyvalent.',
    models: {
      fast:     'gpt-4o-mini',
      main:     'gpt-4o',
      matching: 'gpt-4o',
    },
    envKey:  'OPENAI_API_KEY',
    website: 'https://platform.openai.com',
    pros:    ['Très performant', 'Large écosystème', 'Support Vision/PDF'],
    cons:    ['Coût élevé sur GPT-4o', 'Latence parfois plus haute'],
  },
};
