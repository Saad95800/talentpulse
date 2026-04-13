import { GoogleGenerativeAI } from '@google/generative-ai';
import type { IAIProvider, AIMessage, AICompletionOptions } from '../types';

export class GeminiProvider implements IAIProvider {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(model: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY manquante dans les variables d\'environnement.');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async complete(messages: AIMessage[], options: AICompletionOptions = {}): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY!;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;

    // Construction du contenu : system prompt injecté dans le premier message utilisateur
    const parts: string[] = [];
    if (options.system) {
      parts.push(options.system);
    }

    // On ajoute l'historique des messages
    const contents = messages.map((m, idx) => {
      const role = m.role === 'assistant' ? 'model' : 'user';
      let text = m.content;
      // Injecter le system prompt dans le premier message user
      if (idx === 0 && options.system) {
        text = `${options.system}\n\n${m.content}`;
      }
      return { role, parts: [{ text }] };
    });

    const body = {
      contents,
      generationConfig: {
        maxOutputTokens: options.maxTokens  ?? 4096,
        temperature:     options.temperature ?? 0,
      },
    };

    try {
      const res  = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error?.message ?? `HTTP ${res.status}`;
        if (res.status === 429 || msg.includes('quota') || msg.includes('Too Many Requests')) {
          throw new Error('Quota Gemini dépassé. Activez la facturation sur aistudio.google.com.');
        }
        if (res.status === 401 || res.status === 403) {
          throw new Error('Clé API Gemini invalide. Vérifiez GEMINI_API_KEY dans votre fichier .env.');
        }
        throw new Error(`Gemini API error: ${msg}`);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Réponse Gemini vide.');
      return text;

    } catch (e: any) {
      throw e;
    }
  }

  async completeWithDocument(
    text:      string,
    _pdfBuffer: Buffer,
    options:   AICompletionOptions = {}
  ): Promise<string> {
    const prompt = options.system
      ? `${options.system}\n\nContenu du CV :\n\n${text}`
      : `Contenu du CV :\n\n${text}`;

    return this.complete([{ role: 'user', content: prompt }], {
      maxTokens:   options.maxTokens,
      temperature: options.temperature,
    });
  }
}
