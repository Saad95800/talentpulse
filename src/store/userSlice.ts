import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string;
  phone: string;
  credits: number;
  role: 'ADMIN' | 'USER';
  plan?: string;
  subscriptionStatus?: string | null;
  nextBillingDate?: string | Date | null;
}

interface UserState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isVerified: boolean;
}

const initialState: UserState = {
  user: null,
  token: null,
  isLoggedIn: false,
  isVerified: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User & { token?: string }>) => {
      const { token, ...userData } = action.payload;
      state.user = userData;
      if (token) {
        state.token = token;
        state.isLoggedIn = true;
      }
      state.isVerified = true;
    },
    updateCredits: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.credits = action.payload;
      }
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isLoggedIn = false;
      state.isVerified = false;
    },
  },
});

export const { setUser, updateCredits, setToken, logout } = userSlice.actions;
export default userSlice.reducer;
