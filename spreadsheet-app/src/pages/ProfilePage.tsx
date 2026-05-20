import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { changePassword, logoutUser, updateProfile } from '@/features/auth/authSlice';
import { fetchDocuments } from '@/features/documents/documentsSlice';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === 'string') {
      return message;
    }
  }

  return 'Ошибка запроса';
}

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const documentsCount = useAppSelector((state) => state.documents.items.length);
  const listStatus = useAppSelector((state) => state.documents.listStatus);
  const [name, setName] = useState(user?.name ?? '');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (listStatus === 'idle') {
      void dispatch(fetchDocuments());
    }
  }, [dispatch, listStatus]);

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  if (!user) {
    return null;
  }

  const logout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  const submitName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);

    if (name.trim().length < 2) {
      setProfileError('Имя должно содержать минимум 2 символа');
      return;
    }

    try {
      await dispatch(updateProfile({ name })).unwrap();
      setProfileMessage('Имя обновлено');
    } catch (error) {
      setProfileError(getErrorMessage(error));
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordError('Новый пароль должен содержать минимум 8 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }

    try {
      await dispatch(changePassword({ currentPassword, newPassword })).unwrap();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Пароль обновлён');
    } catch (error) {
      setPasswordError(getErrorMessage(error));
    }
  };

  return (
    <main className="profile-page">
      <section className="profile-card">
        <h2>Данные пользователя</h2>
        <dl className="profile-list">
          <div>
            <dt>Имя</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Дата регистрации</dt>
            <dd>{formatDate(user.registeredAt)}</dd>
          </div>
          <div>
            <dt>Документы</dt>
            <dd>{documentsCount}</dd>
          </div>
        </dl>
      </section>

      <section className="profile-card">
        <h2>Изменение имени</h2>
        <form className="profile-form" onSubmit={(event) => void submitName(event)}>
          <label className="field">
            Имя
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          {profileError ? <div className="alert alert--error">{profileError}</div> : null}
          {profileMessage ? <div className="alert alert--success">{profileMessage}</div> : null}
          <button type="submit" className="button">
            Сохранить имя
          </button>
        </form>
      </section>

      <section className="profile-card">
        <h2>Смена пароля</h2>
        <form className="profile-form" onSubmit={(event) => void submitPassword(event)}>
          <label className="field">
            Текущий пароль
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
          <label className="field">
            Новый пароль
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <label className="field">
            Подтверждение нового пароля
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          {passwordError ? <div className="alert alert--error">{passwordError}</div> : null}
          {passwordMessage ? <div className="alert alert--success">{passwordMessage}</div> : null}
          <button type="submit" className="button">
            Сменить пароль
          </button>
        </form>
      </section>

      <section className="profile-card">
        <h2>Сессия</h2>
        <button type="button" className="button button--danger" onClick={() => void logout()}>
          Выйти
        </button>
      </section>
    </main>
  );
}
