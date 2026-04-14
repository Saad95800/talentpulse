import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import matchingReducer from './matchingSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    matching: matchingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Exposer le store pour Cypress en développement
declare global {
  interface Window {
    Cypress?: unknown;
    store?: typeof store;
  }
}

if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || window.Cypress)) {
  window.store = store;
}

