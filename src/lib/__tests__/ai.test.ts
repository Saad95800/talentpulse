/**
 * Test de robustesse pour le parsing JSON de l'IA.
 * Note: On teste ici la logique de parsing qu'on pourrait exposer 
 * si on veut être plus robuste (ex: extraire le JSON d'un bloc markdown).
 */

export function extractJSON(text: string) {
  try {
    // Tentative de trouver du JSON entouré de triple backticks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = match ? match[1].trim() : text.trim();
    return JSON.parse(jsonString);
  } catch (e) {
    throw new Error("Impossible de parser le JSON de la réponse IA.");
  }
}

describe('AI Parsing Robustness', () => {
  it('should parse clean JSON', () => {
    const raw = '{"score": 85, "competences_validees": ["React"], "competences_manquantes": [], "argumentaire_client": "Top."}';
    const result = extractJSON(raw);
    expect(result.score).toBe(85);
  });

  it('should parse JSON inside markdown blocks', () => {
    const raw = 'Voici l\'analyse :\n```json\n{"score": 90, "competences_validees": ["Node"], "competences_manquantes": [], "argumentaire_client": "Strong."}\n```\nEn espérant que cela vous aide.';
    const result = extractJSON(raw);
    expect(result.score).toBe(90);
  });

  it('should throw error for invalid JSON', () => {
    const raw = 'Désolé, je ne peux pas analyser ce fichier.';
    expect(() => extractJSON(raw)).toThrow();
  });
});
