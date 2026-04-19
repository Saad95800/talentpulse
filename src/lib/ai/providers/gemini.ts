import { GoogleGenerativeAI } from '@google/generative-ai';
import type { IAIProvider, AIMessage, AICompletionOptions } from '../types';

/**
 * Interface interne pour la gestion des tentatives (Retry)
 */
interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
}

export class GeminiProvider implements IAIProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(modelName: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY manquante dans les variables d\'environnement.');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  /**
   * Encapsule un appel avec une logique de Retry exponentiel.
   * Utile pour contrer les erreurs 'fetch failed' et les surcharges API.
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>, 
    options: RetryOptions = { maxRetries: 3, initialDelayMs: 1500 }
  ): Promise<T> {
    let lastError: unknown;
    
    for (let i = 0; i <= options.maxRetries; i++) {
      try {
        return await operation();
      } catch (err: unknown) {
        lastError = err;
        const error = err as { message?: string; name?: string; status?: number };
        const msg = (error.message || "").toLowerCase();
        
        // Détection des erreurs éligibles au Retry
        const isNetworkError = msg.includes('fetch failed') || msg.includes('network') || msg.includes('econnreset');
        const isTimeout = msg.includes('aborted') || msg.includes('timeout') || msg.includes('deadline exceeded') || error.name === 'AbortError';
        const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('limit');
        const isServerSide = msg.includes('500') || msg.includes('503') || msg.includes('504') || msg.includes('bad gateway');

        if (i < options.maxRetries && (isNetworkError || isTimeout || isRateLimit || isServerSide)) {
          const delay = options.initialDelayMs * Math.pow(2, i);
          const type = isTimeout ? "TIMEOUT" : isRateLimit ? "QUOTA" : "RÉSEAU/SERVEUR";
          
          console.warn(`[Gemini:Retry] Tentative ${i + 1} échouée [${type}] : ${msg}. Nouvel essai dans ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  /**
   * Complétion texte standard.
   */
  async complete(messages: AIMessage[], options: AICompletionOptions = {}): Promise<string> {
    return this.executeWithRetry(async () => {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          maxOutputTokens: options.maxTokens ?? 32000,
          temperature: options.temperature ?? 0,
          responseMimeType: options.json ? 'application/json' : 'text/plain',
          responseSchema: options.schema as any,
        },
      });

      const chatMessages = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      if (options.system && chatMessages.length > 0) {
        chatMessages[0].parts[0].text = `${options.system}\n\n${chatMessages[0].parts[0].text}`;
      }

      const result = await model.generateContent({
        contents: chatMessages,
      }, { timeout: 300000 }); // Augmenté à 300s (5min) pour supporter les gros flux de matching

      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error('Réponse Gemini SDK vide.');
      return text;
    });
  }

  /**
   * Complétion multimodale (PDF/Image).
   */
  async completeWithDocument(
    text:      string,
    buffer:    Buffer,
    mimeType:  string,
    options:   AICompletionOptions = {}
  ): Promise<string> {
    return this.executeWithRetry(async () => {
      const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
      console.log(`[Gemini:SDK] Envoi document (${mimeType}) - Taille: ${sizeMB} MB`);

      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          maxOutputTokens: options.maxTokens ?? 32000,
          temperature: options.temperature ?? 0,
          responseMimeType: options.json ? 'application/json' : 'text/plain',
          responseSchema: options.schema as any,
        },
      });

      const promptParts: { text?: string; inlineData?: { data: string; mimeType: string } }[] = [];
      const pageLimitInstruction = mimeType === 'application/pdf' 
        ? "\n\nIMPORTANT: Analyse UNIQUEMENT les 10 premières pages si le document est long." 
        : "";

      const fullInstruction = (options.system || "") + pageLimitInstruction;
      if (fullInstruction) promptParts.push({ text: fullInstruction });
      if (text) promptParts.push({ text: `Texte extrait du document :\n${text}` });

      promptParts.push({
        inlineData: {
          data: buffer.toString('base64'),
          mimeType
        }
      });

      const result = await model.generateContent({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        contents: [{ role: 'user', parts: promptParts as any }],
      }, { timeout: 300000 }); // Augmenté à 300s (5min) pour l'OCR et les PDF lourds

      const response = await result.response;
      const resultText = response.text();

      if (!resultText) throw new Error('Réponse Gemini Multimodale SDK vide.');
      return resultText;
    }, { maxRetries: 3, initialDelayMs: 2000 });
  }
}

