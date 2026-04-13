import OpenAI from 'openai';
import type { IAIProvider, AIMessage, AICompletionOptions } from '../types';

export class OpenAIProvider implements IAIProvider {
  private client: OpenAI;
  private model:  string;

  constructor(model: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY manquante dans les variables d\'environnement.');
    this.client = new OpenAI({ apiKey });
    this.model  = model;
  }

  async complete(messages: AIMessage[], options: AICompletionOptions = {}): Promise<string> {
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (options.system) {
      openaiMessages.push({ role: 'system', content: options.system });
    }

    openaiMessages.push(
      ...messages.map(m => ({
        role:    m.role as 'user' | 'assistant',
        content: m.content,
      }))
    );

    try {
      const response = await this.client.chat.completions.create({
        model:       this.model,
        max_tokens:  options.maxTokens  ?? 4096,
        temperature: options.temperature ?? 0,
        messages:    openaiMessages,
      });

      const text = response.choices[0]?.message?.content;
      if (!text) throw new Error('Réponse OpenAI vide.');
      return text;
    } catch (e: any) {
      const msg: string = e?.message ?? '';
      if (e?.status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('rate limit')) {
        throw new Error(
          'Quota OpenAI dépassé. Vérifiez votre plan sur platform.openai.com ' +
          'ou changez de provider IA.'
        );
      }
      if (e?.status === 401 || msg.includes('401') || msg.includes('Incorrect API key')) {
        throw new Error('Clé API OpenAI invalide. Vérifiez OPENAI_API_KEY dans votre fichier .env.');
      }
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
