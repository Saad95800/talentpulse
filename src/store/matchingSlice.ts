import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MatchResult } from '@/lib/ai';

interface MatchingState {
  currentResult: MatchResult | null;
  loading: boolean;
  error: string | null;
}

const initialState: MatchingState = {
  currentResult: null,
  loading: false,
  error: null,
};

export const matchingSlice = createSlice({
  name: 'matching',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setResult: (state, action: PayloadAction<MatchResult>) => {
      state.currentResult = action.payload;
      state.loading = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    resetResult: (state) => {
      state.currentResult = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setLoading, setResult, setError, resetResult } = matchingSlice.actions;
export default matchingSlice.reducer;
