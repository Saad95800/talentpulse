import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MatchResult } from '@/lib/ai';

interface MatchingState {
  currentResult: MatchResult | null;
  results: MatchResult[];
  loading: boolean;
  loadingStep: string;
  error: string | null;
}

const initialState: MatchingState = {
  currentResult: null,
  results: [],
  loading: false,
  loadingStep: "",
  error: null,
};

export const matchingSlice = createSlice({
  name: 'matching',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (!action.payload) state.loadingStep = "";
    },
    setLoadingStep: (state, action: PayloadAction<string>) => {
      state.loadingStep = action.payload;
    },
    setResult: (state, action: PayloadAction<MatchResult>) => {
      state.currentResult = action.payload;
      state.results = [action.payload]; // Par défaut, un seul résultat
      state.loading = false;
      state.loadingStep = "";
      state.error = null;
    },
    setMultiResults: (state, action: PayloadAction<MatchResult[]>) => {
      state.results = action.payload;
      state.currentResult = action.payload.length === 1 ? action.payload[0] : null;
      state.loading = false;
      state.loadingStep = "";
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
      state.loadingStep = "";
    },
    resetResult: (state) => {
      state.currentResult = null;
      state.results = [];
      state.loading = false;
      state.loadingStep = "";
      state.error = null;
    },
  },
});

export const { setLoading, setLoadingStep, setResult, setMultiResults, setError, resetResult } = matchingSlice.actions;
export default matchingSlice.reducer;
