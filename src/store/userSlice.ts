import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  isLoggedIn: boolean;
  id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  credits: number;
}

const initialState: UserState = {
  isLoggedIn: false,
  id: null,
  name: null,
  email: null,
  phone: null,
  credits: 0,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ id: string; name: string | null; email: string; phone: string; credits: number }>) => {
      state.isLoggedIn = true;
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.phone = action.payload.phone;
      state.credits = action.payload.credits;
    },
    updateCredits: (state, action: PayloadAction<number>) => {
      state.credits = action.payload;
    },
    clearUser: (state) => {
      state.isLoggedIn = false;
      state.id = null;
      state.name = null;
      state.email = null;
      state.phone = null;
      state.credits = 0;
    },
  },
});

export const { setUser, updateCredits, clearUser } = userSlice.actions;
export default userSlice.reducer;
