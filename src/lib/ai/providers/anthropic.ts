import Anthropic from '@anthropic-ai/sdk';
import type { IAIProvider, AIMessage, AICompletionOptions } from '../types';

export class AnthropicProvider implements IAIProvider {
  private client: Anthropic;
  private model:  string;

  constructor(model: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante dans les variables d\'environnement.');
    this.client = new Anthropic({ apiKey });
    this.model  = model;
  }

  async complete(messages: AIMessage[], options: AICompletionOptions = {}): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model:       this.model,
        max_tokens:  options.maxTokens  ?? 4096,
        system:      options.system,
        temperature: options.temperature ?? 0,
        messages:    messages.map(m => ({ role: m.role, content: m.content })),
      });

      const block = response.content.find(b => b.type === 'text');
      if (!block || block.type !== 'text') throw new Error('Réponse Anthropic vide.');
      return block.text;
    } catch (e: any) {
      const msg: string = e?.message ?? '';
      if (e?.status === 404 || msg.includes('not_found')) {
        throw new Error(
          'Le modèle Anthropic demandé n\'est pas accessible avec votre clé API. ' +
          'Essayez de changer de provider IA dans vos paramètres (Gemini recommandé).'
        );
      }
      if (e?.status === 429 || msg.includes('rate_limit') || msg.includes('rate limit')) {
        throw new Error(
          'Limite de tokens Anthropic atteinte. Réessayez dans quelques secondes ' +
          'ou changez de provider IA.'
        );
      }
      if (e?.status === 401 || msg.includes('401') || msg.includes('authentication')) {
        throw new Error('Clé API Anthropic invalide. Vérifiez ANTHROPIC_API_KEY dans votre fichier .env.');
      }
      throw e;
    }
  }

  async completeWithDocument(
    text:      string,
    pdfBuffer: Buffer,
    options:   AICompletionOptions = {}
  ): Promise<string> {
    const content: Anthropic.ContentBlockParam[] = [];

    if (text.length < 200) {
      content.push({
        type:   'document',
        source: {
          type:       'base64',
          media_type: 'application/pdf',
          data:       pdfBuffer.toString('base64'),
        },
      } as any);
    } else {
      content.push({ type: 'text', text: `Contenu du CV :\n\n${text}` });
    }

    if (options.system) {
      content.push({ type: 'text', text: options.system });
    }

    const response = await this.client.messages.create({
      model:      this.model,
      max_tokens: options.maxTokens ?? 4096,
      messages:   [{ role: 'user', content }],
    });

    const block = response.content.find(b => b.type === 'text');
    if (!block || block.type !== 'text') throw new Error('Réponse Anthropic vide.');
    return block.text;
  }
}
