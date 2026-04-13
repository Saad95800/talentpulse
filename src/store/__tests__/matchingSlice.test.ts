import matchingReducer, { 
  setLoading, 
  setResult, 
  setError, 
  resetResult 
} from '../matchingSlice';

describe('matchingSlice', () => {
  const initialState = {
    currentResult: null,
    loading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(matchingReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setLoading', () => {
    const actual = matchingReducer(initialState, setLoading(true));
    expect(actual.loading).toBe(true);
  });

  it('should handle setResult', () => {
    const result = {
      score: 8.5,
      competences_validees: ['React', 'TS'],
      competences_manquantes: ['Redux'],
      argumentaire_client: 'Excellent profil.',
    };
    const actual = matchingReducer(initialState, setResult(result));
    expect(actual.currentResult).toEqual(result);
    expect(actual.loading).toBe(false);
  });

  it('should handle setError', () => {
    const actual = matchingReducer(initialState, setError('Erreur de test'));
    expect(actual.error).toBe('Erreur de test');
    expect(actual.loading).toBe(false);
  });

  it('should handle resetResult', () => {
    const modifiedState = {
      currentResult: {
        score: 8.5,
        competences_validees: ['React'],
        competences_manquantes: [],
        argumentaire_client: 'Good.',
      },
      loading: false,
      error: null,
    };
    const actual = matchingReducer(modifiedState, resetResult());
    expect(actual).toEqual(initialState);
  });
});
