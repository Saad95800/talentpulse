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
