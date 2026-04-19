import { processMatchingWorkflow } from '../matching.action';
import * as ai from '../../lib/ai';

// Mocks
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'user-1', credits: 10 })
    },
    mission: {
      create: jest.fn().mockResolvedValue({ id: 'mission-1', title: 'Job', description: 'Desc' })
    },
    candidate: {
      create: jest.fn().mockResolvedValue({ id: 'cand-1', name: 'Jean Dupont' })
    },
    matchRecord: {
      create: jest.fn().mockResolvedValue({ id: 'match-1' })
    }
  }
}));

jest.mock('../../lib/ai', () => ({
  __esModule: true,
  validateDocumentConformity: jest.fn().mockResolvedValue({ isConform: true, reason: null }),
  extractCandidateInfo: jest.fn().mockResolvedValue({ firstName: 'Jean', lastName: 'Dupont' }),
  generateMatchingScore: jest.fn().mockResolvedValue({ 
    score: 80, 
    competences_validees: ['Node'], 
    competences_manquantes: [], 
    argumentaire_client: 'Cool' 
  }),
  extractJSON: jest.fn().mockImplementation((t) => JSON.parse(t))
}));

jest.mock('../../lib/document', () => ({
  __esModule: true,
  extractTextFromFile: jest.fn().mockResolvedValue({ text: "Simulated Text", isScanned: false })
}));

jest.mock('../credits.action', () => ({
  __esModule: true,
  checkCredits: jest.fn().mockResolvedValue({ success: true, currentCredits: 10 }),
  deductCredit: jest.fn().mockResolvedValue({ success: true, creditsRemaining: 9 })
}));

jest.mock('../logger.action', () => ({
  __esModule: true,
  logError: jest.fn().mockResolvedValue(null),
  logInfo: jest.fn().mockResolvedValue(null),
  logWarn: jest.fn().mockResolvedValue(null)
}));

describe('Matching Workflow Action', () => {

  it('should successfully match a CV and deduct credits', async () => {
    const formData = new FormData();
    formData.append('userId', 'user-1');
    formData.append('cvTextRaw', "CV Content");
    formData.append('jobTextRaw', "Job Content");
    
    // On simule l'appel de l'action
    const result = await processMatchingWorkflow(formData);
    
    expect(result.success).toBe(true);
    expect(result.data?.score).toBe(80);
    // On vérifie que la conformité a été appelée
    expect(ai.validateDocumentConformity).toHaveBeenCalled();
  });

  it('should fail if document is not conform', async () => {
    (ai.validateDocumentConformity as jest.Mock).mockResolvedValueOnce({ 
      isConform: false, 
      reason: "Pas un CV" 
    });

    const formData = new FormData();
    formData.append('userId', 'user-1');
    formData.append('cvTextRaw', "Pizza Menu");
    formData.append('jobTextRaw', "Job Content");

    const result = await processMatchingWorkflow(formData);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("Pas un CV");
  });
});
