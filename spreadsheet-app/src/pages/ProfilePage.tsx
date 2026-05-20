import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchDocuments } from '@/features/documents/documentsSlice';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const documentsCount = useAppSelector((state) => state.documents.items.length);
  const listStatus = useAppSelector((state) => state.documents.listStatus);

  useEffect(() => {
    if (listStatus === 'idle') {
      void dispatch(fetchDocuments());
    }
  }, [dispatch, listStatus]);

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
    </main>
  );
}
