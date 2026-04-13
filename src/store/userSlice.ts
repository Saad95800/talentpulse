import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  id: string | null;
  email: string | null;
  credits: number;
}

const initialState: UserState = {
  id: null,
  email: null,
  credits: 0,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ id: string; email: string; credits: number }>) => {
      state.id = action.payload.id;
      state.email = action.payload.email;
      state.credits = action.payload.credits;
    },
    updateCredits: (state, action: PayloadAction<number>) => {
      state.credits = action.payload;
    },
    clearUser: (state) => {
      state.id = null;
      state.email = null;
      state.credits = 0;
    },
  },
});

export const { setUser, updateCredits, clearUser } = userSlice.actions;
export default userSlice.reducer;
