import type { AuthSession, AuthUser } from '@/types';
import { ApiError } from '@/services/apiError';

interface StoredUser extends AuthUser {
  password: string;
}

interface RefreshSession {
  refreshToken: string;
  userId: string;
  expiresAt: string;
}

interface AuthDatabase {
  users: StoredUser[];
  refreshSessions: RefreshSession[];
}

interface AccessSession {
  userId: string;
  expiresAt: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

const AUTH_STORAGE_KEY = 'spreadsheet-auth-v1';
const REFRESH_TOKEN_KEY = 'spreadsheet-refresh-token-v1';
const ACCESS_TOKEN_LIFETIME_MS = 90_000;
const REFRESH_TOKEN_LIFETIME_MS = 1000 * 60 * 60 * 24 * 7;
const MOCK_DELAY = 180;

const accessSessions = new Map<string, AccessSession>();

const defaultUser: StoredUser = {
  id: 'user-1',
  name: 'PoroxBag',
  email: 'Proxorbag@bubl.com',
  registeredAt: '2026-05-01T09:00:00.000Z',
  password: 'password123',
};

function wait(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_DELAY);
  });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createToken(prefix: string, userId: string): string {
  return `${prefix}_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function toUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    registeredAt: user.registeredAt,
  };
}

function readDatabase(): AuthDatabase {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    const database = { users: [defaultUser], refreshSessions: [] };
    writeDatabase(database);
    return database;
  }

  try {
    const database = JSON.parse(raw) as AuthDatabase;

    if (!Array.isArray(database.users) || !Array.isArray(database.refreshSessions)) {
      throw new Error('Invalid auth storage');
    }

    const hasDefaultUser = database.users.some((user) => user.id === defaultUser.id);

    if (!hasDefaultUser) {
      database.users.unshift(defaultUser);
      writeDatabase(database);
    }

    return database;
  } catch {
    const database = { users: [defaultUser], refreshSessions: [] };
    writeDatabase(database);
    return database;
  }
}

function writeDatabase(database: AuthDatabase): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(database));
}

function createSession(user: StoredUser): AuthSession {
  const accessToken = createToken('access', user.id);
  const refreshToken = createToken('refresh', user.id);
  const accessExpiresAt = Date.now() + ACCESS_TOKEN_LIFETIME_MS;
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS).toISOString();
  const database = readDatabase();

  accessSessions.set(accessToken, {
    userId: user.id,
    expiresAt: accessExpiresAt,
  });

  database.refreshSessions = database.refreshSessions.filter((session) => session.userId !== user.id);
  database.refreshSessions.push({ refreshToken, userId: user.id, expiresAt: refreshExpiresAt });
  writeDatabase(database);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  return {
    user: toUser(user),
    accessToken,
    refreshToken,
  };
}

function getUserById(database: AuthDatabase, userId: string): StoredUser {
  const user = database.users.find((item) => item.id === userId);

  if (!user) {
    throw new ApiError(401, 'Пользователь не найден');
  }

  return user;
}

export const authService = {
  async login(request: LoginRequest): Promise<AuthSession> {
    await wait();
    const database = readDatabase();
    const email = normalizeEmail(request.email);
    const user = database.users.find((item) => normalizeEmail(item.email) === email);

    if (!user || user.password !== request.password) {
      throw new ApiError(401, 'Неверный email или пароль');
    }

    return createSession(user);
  },

  async register(request: RegisterRequest): Promise<AuthSession> {
    await wait();
    const database = readDatabase();
    const email = normalizeEmail(request.email);
    const isEmailTaken = database.users.some((user) => normalizeEmail(user.email) === email);

    if (isEmailTaken) {
      throw new ApiError(409, 'Пользователь с таким email уже существует');
    }

    const user: StoredUser = {
      id: createId(),
      name: request.name.trim(),
      email: request.email.trim(),
      registeredAt: new Date().toISOString(),
      password: request.password,
    };

    database.users.push(user);
    writeDatabase(database);
    return createSession(user);
  },

  async refresh(refreshToken: string): Promise<AuthSession> {
    await wait();
    const database = readDatabase();
    const session = database.refreshSessions.find((item) => item.refreshToken === refreshToken);

    if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
      throw new ApiError(401, 'Сессия истекла');
    }

    const user = getUserById(database, session.userId);
    return createSession(user);
  },

  async logout(refreshToken: string | null): Promise<void> {
    await wait();
    const database = readDatabase();

    if (refreshToken) {
      database.refreshSessions = database.refreshSessions.filter(
        (session) => session.refreshToken !== refreshToken,
      );
      writeDatabase(database);
    }

    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  async updateProfile(accessToken: string, request: UpdateProfileRequest): Promise<AuthUser> {
    await wait();
    const currentUser = this.getUserFromAccessToken(accessToken);
    const database = readDatabase();
    const userIndex = database.users.findIndex((user) => user.id === currentUser.id);

    if (userIndex < 0) {
      throw new ApiError(401, 'Пользователь не найден');
    }

    database.users[userIndex] = {
      ...database.users[userIndex],
      name: request.name.trim(),
    };
    writeDatabase(database);

    return toUser(database.users[userIndex]);
  },

  async changePassword(accessToken: string, request: ChangePasswordRequest): Promise<void> {
    await wait();
    const currentUser = this.getUserFromAccessToken(accessToken);
    const database = readDatabase();
    const userIndex = database.users.findIndex((user) => user.id === currentUser.id);

    if (userIndex < 0) {
      throw new ApiError(401, 'Пользователь не найден');
    }

    if (database.users[userIndex].password !== request.currentPassword) {
      throw new ApiError(400, 'Текущий пароль указан неверно');
    }

    database.users[userIndex] = {
      ...database.users[userIndex],
      password: request.newPassword,
    };
    writeDatabase(database);
  },

  getStoredRefreshToken(): string | null {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  clearStoredRefreshToken(): void {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAccessTokenExpired(accessToken: string | null): boolean {
    if (!accessToken) {
      return true;
    }

    if (accessToken === 'mock-access-token') {
      return false;
    }

    const session = accessSessions.get(accessToken);
    return !session || session.expiresAt <= Date.now();
  },

  getUserFromAccessToken(accessToken: string): AuthUser {
    const database = readDatabase();

    if (accessToken === 'mock-access-token') {
      return toUser(getUserById(database, defaultUser.id));
    }

    const session = accessSessions.get(accessToken);

    if (!session || session.expiresAt <= Date.now()) {
      throw new ApiError(401, 'Access Token истёк');
    }

    return toUser(getUserById(database, session.userId));
  },
};
