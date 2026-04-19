import matchingReducer, { 
  setLoading, 
  setLoadingStep, 
  setBatchProgress, 
  setResult, 
  resetResult 
} from '../matchingSlice';
import { MatchResult } from '@/lib/ai';

const mockResult: MatchResult = {
  score: 90,
  competences_validees: [],
  competences_manquantes: [],
  argumentaire_client: "Test",
  candidateInfo: { firstName: 'A', lastName: 'B' }
};

describe('matchingSlice', () => {
  const initialState = {
    currentResult: null,
    results: [],
    loading: false,
    loadingStep: "",
    batchCurrent: 0,
    batchTotal: 0,
    error: null,
  };

  it('should return the initial state', () => {
    expect(matchingReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setLoading (true)', () => {
    const actual = matchingReducer(initialState, setLoading(true));
    expect(actual.loading).toBe(true);
  });

  it('should handle setLoading (false) and reset progress', () => {
    const state = { ...initialState, loading: true, batchCurrent: 5, batchTotal: 10 };
    const actual = matchingReducer(state, setLoading(false));
    expect(actual.loading).toBe(false);
    expect(actual.batchCurrent).toBe(0);
    expect(actual.batchTotal).toBe(0);
  });

  it('should set batch progress', () => {
    const state = matchingReducer(initialState, setBatchProgress({ current: 2, total: 5 }));
    expect(state.batchCurrent).toBe(2);
    expect(state.batchTotal).toBe(5);
  });

  it('should set loading step', () => {
    const state = matchingReducer(initialState, setLoadingStep("Analyse..."));
    expect(state.loadingStep).toBe("Analyse...");
  });

  it('should set result and reset loading', () => {
    const state = matchingReducer({ ...initialState, loading: true, batchCurrent: 1, batchTotal: 1 }, setResult(mockResult));
    expect(state.currentResult).toEqual(mockResult);
    expect(state.loading).toBe(false);
    expect(state.batchCurrent).toBe(0);
  });

  it('should handle resetResult', () => {
    const modifiedState = {
      ...initialState,
      currentResult: mockResult,
      results: [mockResult],
      loading: true,
    };
    const actual = matchingReducer(modifiedState, resetResult());
    expect(actual).toEqual(initialState);
  });
});
