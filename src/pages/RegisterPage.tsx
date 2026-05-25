import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { registerUser } from '@/features/auth/authSlice';
import type { ApiErrorPayload } from '@/types';

interface LocationState {
  from?: {
    pathname: string;
    search: string;
  };
}

function isApiErrorPayload(error: unknown): error is ApiErrorPayload {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ApiErrorPayload).message === 'string'
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = useMemo(() => {
    const state = location.state as LocationState | null;
    const pathname = state?.from?.pathname ?? '/dashboard';
    const search = state?.from?.search ?? '';
    return `${pathname}${search}`;
  }, [location.state]);

  if (user) {
    return <Navigate to={from} replace />;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Имя должно содержать минимум 2 символа');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Введите корректный email');
      return;
    }

    if (password.length < 8) {
      setError('Пароль должен быть не короче 8 символов');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(registerUser({ name: name.trim(), email: email.trim(), password })).unwrap();
      navigate(from, { replace: true });
    } catch (registerError) {
      setError(isApiErrorPayload(registerError) ? registerError.message : 'Не удалось зарегистрироваться');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card__header">
          <h1>Регистрация</h1>
          <p>Создайте аккаунт для личных документов.</p>
        </div>
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          <label className="field">
            <span>Имя</span>
            <input value={name} autoComplete="name" onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              value={email}
              type="email"
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Пароль</span>
            <input
              value={password}
              type="password"
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Подтверждение пароля</span>
            <input
              value={confirmPassword}
              type="password"
              autoComplete="new-password"
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          {error ? <div className="alert alert--error">{error}</div> : null}
          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="auth-card__footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </section>
    </main>
  );
}
