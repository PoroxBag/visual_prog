import { describe, expect, it } from 'vitest';
import { authReducer, loginUser, logout, refreshAccessToken, registerUser } from '@/features/auth/authSlice';
import type { AuthSession } from '@/types';

const session: AuthSession = {
  user: {
    id: 'user-2',
    name: 'New User',
    email: 'new@example.com',
    registeredAt: '2026-05-20T10:00:00.000Z',
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

describe('authSlice', () => {
  it('stores login and registration sessions', () => {
    let state = authReducer(
      undefined,
      loginUser.fulfilled(session, '', { email: session.user.email, password: 'password123' }),
    );

    expect(state.user?.id).toBe('user-2');
    expect(state.accessToken).toBe('access-token');

    state = authReducer(
      state,
      registerUser.fulfilled(session, '', {
        name: session.user.name,
        email: session.user.email,
        password: 'password123',
      }),
    );

    expect(state.refreshToken).toBe('refresh-token');
  });

  it('clears session after logout or rejected refresh', () => {
    let state = authReducer(undefined, logout());

    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();

    state = authReducer(undefined, refreshAccessToken.rejected(null, '', undefined));

    expect(state.user).toBeNull();
    expect(state.refreshToken).toBeNull();
  });
});
