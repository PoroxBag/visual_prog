import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { ApiError } from '@/services/apiError';
import { authService, type LoginRequest, type RegisterRequest } from '@/services/authService';
import type { ApiErrorPayload, AuthSession, AuthState } from '@/types';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: authService.getStoredRefreshToken(),
};

function toErrorPayload(error: unknown): ApiErrorPayload {
  if (error instanceof ApiError) {
    return { status: error.status, message: error.message };
  }

  if (error instanceof Error) {
    return { status: 500, message: error.message };
  }

  return { status: 500, message: 'Неизвестная ошибка' };
}

function applySession(state: AuthState, session: AuthSession): void {
  state.user = session.user;
  state.accessToken = session.accessToken;
  state.refreshToken = session.refreshToken;
}

export const loginUser = createAsyncThunk<AuthSession, LoginRequest, { rejectValue: ApiErrorPayload }>(
  'auth/loginUser',
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.login(payload);
    } catch (error) {
      return rejectWithValue(toErrorPayload(error));
    }
  },
);

export const registerUser = createAsyncThunk<AuthSession, RegisterRequest, { rejectValue: ApiErrorPayload }>(
  'auth/registerUser',
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.register(payload);
    } catch (error) {
      return rejectWithValue(toErrorPayload(error));
    }
  },
);

export const refreshAccessToken = createAsyncThunk<
  AuthSession,
  void,
  { state: RootState; rejectValue: ApiErrorPayload }
>('auth/refreshAccessToken', async (_, { getState, rejectWithValue }) => {
  try {
    const refreshToken = getState().auth.refreshToken ?? authService.getStoredRefreshToken();

    if (!refreshToken) {
      return rejectWithValue({ status: 401, message: 'Refresh Token отсутствует' });
    }

    return await authService.refresh(refreshToken);
  } catch (error) {
    return rejectWithValue(toErrorPayload(error));
  }
});

export const logoutUser = createAsyncThunk<void, void, { state: RootState }>(
  'auth/logoutUser',
  async (_, { getState }) => {
    await authService.logout(getState().auth.refreshToken);
  },
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      authService.clearStoredRefreshToken();
    },
    setSession(state, action: PayloadAction<AuthSession>) {
      applySession(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        applySession(state, action.payload);
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        applySession(state, action.payload);
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        applySession(state, action.payload);
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        authService.clearStoredRefreshToken();
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      });
  },
});

export const { logout, setSession } = authSlice.actions;
export const authReducer = authSlice.reducer;
