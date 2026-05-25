import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MatchResult } from '@/lib/ai';

interface MatchingState {
  currentResult: MatchResult | null;
  results: MatchResult[];
  loading: boolean;
  loadingStep: string;
  batchCurrent: number;
  batchTotal: number;
  batchItems: { id: string; status: string; candidateName?: string }[];
  error: string | null;
  activeBatchId: string | null;
}

const initialState: MatchingState = {
  currentResult: null,
  results: [],
  loading: false,
  loadingStep: "",
  batchCurrent: 0,
  batchTotal: 0,
  batchItems: [],
  error: null,
  activeBatchId: null,
};

export const matchingSlice = createSlice({
  name: 'matching',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      if (!action) return;
      state.loading = action.payload;
      if (!action.payload) {
        state.loadingStep = "";
        state.batchCurrent = 0;
        state.batchTotal = 0;
        state.batchItems = [];
      }
    },
    setLoadingStep: (state, action: PayloadAction<string>) => {
      if (!action) return;
      state.loadingStep = action.payload;
    },
    setBatchProgress: (state, action: PayloadAction<{ current: number; total: number; items?: { id: string; status: string; candidateName?: string }[] }>) => {
      if (!action || !action.payload) return;
      state.batchCurrent = action.payload.current;
      state.batchTotal = action.payload.total;
      if (action.payload.items) {
        state.batchItems = action.payload.items;
      }
    },
    setResult: (state, action: PayloadAction<MatchResult>) => {
      if (!action || !action.payload) return;
      state.currentResult = action.payload;
      state.results = [action.payload];
      state.loading = false;
      state.loadingStep = "";
      state.batchCurrent = 0;
      state.batchTotal = 0;
      state.error = null;
    },
    setMultiResults: (state, action: PayloadAction<MatchResult[]>) => {
      if (!action || !action.payload) return;
      state.results = action.payload;
      state.currentResult = action.payload.length === 1 ? action.payload[0] : null;
      state.loading = false;
      state.loadingStep = "";
      state.batchCurrent = 0;
      state.batchTotal = 0;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      if (!action) return;
      state.error = action.payload;
      // On ne coupe le chargement que si on a un VRAI message d'erreur
      // Si on reset l'erreur (""), on laisse le chargement tranquille
      if (action.payload) {
        state.loading = false;
        state.loadingStep = "";
        state.batchCurrent = 0;
        state.batchTotal = 0;
      }
    },
    resetResult: (state) => {
      state.currentResult = null;
      state.results = [];
      state.loading = false;
      state.loadingStep = "";
      state.error = null;
      state.activeBatchId = null;
    },
    setActiveBatchId: (state, action: PayloadAction<string | null>) => {
      state.activeBatchId = action.payload;
    },
  },
});

export const { 
  setLoading, 
  setLoadingStep, 
  setBatchProgress, 
  setResult, 
  setMultiResults, 
  setError, 
  resetResult,
  setActiveBatchId 
} = matchingSlice.actions;
export default matchingSlice.reducer;
