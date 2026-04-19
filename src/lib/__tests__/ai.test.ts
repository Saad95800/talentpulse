import { validateDocumentConformity, extractJSON } from '../ai';
import { CONFORMITY_TEST_CASES } from '../test-utils/data';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock pour le SDK Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => '{"isConform": true, "reason": "Test pass"}'
        }
      })
    })
  }))
}));

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

describe('AI Business Logic - Conformity', () => {

  it.each(CONFORMITY_TEST_CASES)(
    'should validate conformity for: $name',
    async ({ doc, expectedCategory }) => {
      const category = expectedCategory.toLowerCase() as 'cv' | 'job';
      const result = await validateDocumentConformity(doc.content, category);
      
      expect(result).toBeDefined();
      expect(typeof result.isConform).toBe('boolean');
    }
  );

  it('should handle AI response failures gracefully (Fail-Safe)', async () => {
    const MockedAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;
    MockedAI.prototype.getGenerativeModel = jest.fn().mockReturnValue({
      generateContent: jest.fn().mockRejectedValue(new Error("API Down"))
    });

    const result = await validateDocumentConformity("test", "cv");
    // Le code actuel retourne { isConform: true } par défaut en cas d'erreur IA
    expect(result.isConform).toBe(true);
  });
});
