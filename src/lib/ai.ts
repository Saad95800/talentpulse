import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  // On ne throw pas ici pour permettre le build, 
  // mais on vérifiera lors de l'appel à la fonction
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'MISSING_KEY',
});

/**
 * Interface pour le résultat structuré du matching IA.
 */
export interface MatchResult {
  score: number;
  competences_validees: string[];
  competences_manquantes: string[];
  argumentaire_client: string;
}
