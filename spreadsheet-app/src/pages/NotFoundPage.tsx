import { Link } from 'react-router-dom';

interface NotFoundPageProps {
  title?: string;
  message?: string;
}

export function NotFoundPage({
  title = 'Страница не найдена',
  message = 'Проверьте адрес или вернитесь к списку документов.',
}: NotFoundPageProps) {
  return (
    <main className="empty-page">
      <h1>{title}</h1>
      <p>{message}</p>
      <Link className="button" to="/dashboard">
        К списку документов
      </Link>
    </main>
  );
}
