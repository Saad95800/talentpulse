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

    } catch (e) {
      throw e;
    }
  }

  async completeWithDocument(
    text:      string,
    buffer:    Buffer,
    mimeType:  string,
    options:   AICompletionOptions = {}
  ): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY!;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;

    const parts: any[] = [];

    // Instruction de limitation de pages si c'est un PDF
    const pageLimitInstruction = mimeType === 'application/pdf' 
      ? "\n\nIMPORTANT: Ce document est peut-être long. Analyse UNIQUEMENT les 10 premières pages." 
      : "";

    if (options.system) {
      parts.push({ text: options.system + pageLimitInstruction });
    }

    // Ajouter le texte extrait s'il existe
    if (text && text.length > 0) {
      parts.push({ text: `Texte extrait du document :\n${text}` });
    }

    // Ajouter le binaire (PDF ou Image)
    parts.push({
      inlineData: {
        mimeType,
        data: buffer.toString('base64')
      }
    });

    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: options.maxTokens  ?? 4096,
        temperature:     options.temperature ?? 0,
      },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(`Gemini Multimodal Error: ${data?.error?.message || res.status}`);

      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error('Réponse Gemini Multimodale vide.');
      return resultText;
    } catch (e) {
      console.error("[Gemini] Multimodal failed, falling back to text only if possible", e);
      throw e;
    }
  }
}
