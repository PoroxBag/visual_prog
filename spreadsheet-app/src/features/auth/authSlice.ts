import { createSlice } from '@reduxjs/toolkit';
import type { AuthState } from '@/types';

const initialState: AuthState = {
  user: {
    id: 'user-1',
    name: 'PoroxBag',
    email: 'Proxorbag@bubl.com',
    registeredAt: '2026-05-01T09:00:00.000Z',
  },
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
    },
  },
});

export const { logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
