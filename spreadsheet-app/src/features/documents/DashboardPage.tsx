import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  clearActiveDocument,
  deleteDocument,
  duplicateDocument,
  fetchDocuments,
  renameDocument,
} from '@/features/documents/documentsSlice';
import { openCreateDocumentModal } from '@/features/ui/uiSlice';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, listStatus, error } = useAppSelector((state) => state.documents);
  const user = useAppSelector((state) => state.auth.user);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    dispatch(clearActiveDocument());
    void dispatch(fetchDocuments());
  }, [dispatch]);

  const openDocument = (documentId: string) => {
    navigate(`/documents/${documentId}`);
  };

  const startRename = (id: string, title: string) => {
    setEditingId(id);
    setEditingTitle(title);
  };

  const commitRename = async () => {
    if (!editingId || editingTitle.trim().length === 0) {
      setEditingId(null);
      return;
    }

    await dispatch(renameDocument({ id: editingId, title: editingTitle.trim() }));
    setEditingId(null);
  };

  return (
    <main className="dashboard">
      <header className="page-header">
        <div>
          <h2>Мои документы</h2>
          <p>
            {user.name} · {user.email}
          </p>
        </div>
        <button type="button" className="button" onClick={() => dispatch(openCreateDocumentModal())}>
          Создать документ
        </button>
      </header>
      {error ? <div className="alert alert--error">{error}</div> : null}
      {listStatus === 'loading' ? <div className="empty-state">Загрузка документов...</div> : null}
      {listStatus !== 'loading' && items.length === 0 ? (
        <div className="empty-state">Документов пока нет.</div>
      ) : null}
      <section className="document-grid">
        {items.map((document) => (
          <article key={document.id} className="document-card">
            <div className="document-card__title-row">
              {editingId === document.id ? (
                <input
                  className="document-card__title-input"
                  value={editingTitle}
                  autoFocus
                  onChange={(event) => setEditingTitle(event.target.value)}
                  onBlur={() => void commitRename()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void commitRename();
                    }

                    if (event.key === 'Escape') {
                      setEditingId(null);
                    }
                  }}
                />
              ) : (
                <h2>{document.title}</h2>
              )}
              <span>
                {document.rowCount}×{document.colCount}
              </span>
            </div>
            <button type="button" className="document-preview" onClick={() => openDocument(document.id)}>
              {document.preview.cells.map((row, rowIndex) => (
                <span key={rowIndex} className="document-preview__row">
                  {row.map((cell, colIndex) => (
                    <span key={`${rowIndex}-${colIndex}`} className="document-preview__cell">
                      {cell}
                    </span>
                  ))}
                </span>
              ))}
            </button>
            <dl className="document-meta">
              <div>
                <dt>Создан</dt>
                <dd>{formatDate(document.createdAt)}</dd>
              </div>
              <div>
                <dt>Изменён</dt>
                <dd>{formatDate(document.updatedAt)}</dd>
              </div>
            </dl>
            <div className="document-actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => openDocument(document.id)}
              >
                Открыть
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => startRename(document.id, document.title)}
              >
                Переименовать
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => void dispatch(duplicateDocument(document.id))}
              >
                Дублировать
              </button>
              <button
                type="button"
                className="button button--danger"
                onClick={() => {
                  if (window.confirm(`Удалить документ «${document.title}»?`)) {
                    void dispatch(deleteDocument(document.id));
                  }
                }}
              >
                Удалить
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
