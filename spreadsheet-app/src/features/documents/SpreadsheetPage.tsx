import { useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { FormattingToolbar } from '@/components/FormattingToolbar';
import { FormulaBar } from '@/components/FormulaBar';
import { Grid } from '@/components/Grid';
import {
  fetchDocuments,
  loadDocument,
  replaceActiveSpreadsheet,
  saveActiveDocument,
} from '@/features/documents/documentsSlice';
import { loadSpreadsheet } from '@/features/spreadsheet/spreadsheetSlice';
import { NotFoundPage } from '@/pages/NotFoundPage';
import type { ApiErrorPayload } from '@/types';
import { csvToSpreadsheetSnapshot, downloadTextFile, spreadsheetToCsv, spreadsheetToJson } from '@/utils/csv';

function sanitizeFilename(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '_');
}

function saveStatusLabel(status: 'saved' | 'saving' | 'error'): string {
  switch (status) {
    case 'saved':
      return 'Сохранено';
    case 'saving':
      return 'Сохранение...';
    case 'error':
      return 'Ошибка сохранения';
  }
}

function isApiErrorPayload(error: unknown): error is ApiErrorPayload {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as ApiErrorPayload).status === 'number'
  );
}

export function SpreadsheetPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId: string }>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeDocument = useAppSelector((state) => state.documents.activeDocument);
  const activeStatus = useAppSelector((state) => state.documents.activeStatus);
  const saveStatus = useAppSelector((state) => state.documents.saveStatus);
  const error = useAppSelector((state) => state.documents.error);
  const spreadsheet = useAppSelector((state) => state.spreadsheet);
  const [isNotFound, setIsNotFound] = useState(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      saveStatus !== 'saved' && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return;
    }

    if (window.confirm('Есть несохранённые изменения. Покинуть документ?')) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  useEffect(() => {
    if (!documentId) {
      setIsNotFound(true);
      return;
    }

    setIsNotFound(false);

    const openDocument = async () => {
      try {
        const document = await dispatch(loadDocument(documentId)).unwrap();
        dispatch(loadSpreadsheet(document.spreadsheet));
      } catch (loadError) {
        if (isApiErrorPayload(loadError) && loadError.status === 403) {
          navigate('/dashboard', { replace: true });
          return;
        }

        setIsNotFound(true);
      }
    };

    void openDocument();
  }, [dispatch, documentId, navigate]);

  const backToDashboard = () => {
    navigate('/dashboard');
    void dispatch(fetchDocuments());
  };

  const exportCsv = () => {
    if (!activeDocument) {
      return;
    }

    downloadTextFile(
      `${sanitizeFilename(activeDocument.title)}.csv`,
      spreadsheetToCsv(spreadsheet),
      'text/csv;charset=utf-8',
    );
  };

  const exportJson = () => {
    if (!activeDocument) {
      return;
    }

    downloadTextFile(
      `${sanitizeFilename(activeDocument.title)}.json`,
      spreadsheetToJson(spreadsheet),
      'application/json;charset=utf-8',
    );
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const snapshot = csvToSpreadsheetSnapshot(text);
    const document = await dispatch(replaceActiveSpreadsheet(snapshot)).unwrap();
    dispatch(loadSpreadsheet(document.spreadsheet));
  };

  if (isNotFound) {
    return (
      <NotFoundPage
        title="Документ не найден"
        message="Документ не существует или был удалён. Вернитесь к списку документов."
      />
    );
  }

  if (activeStatus === 'loading' || !activeDocument || activeDocument.id !== documentId) {
    return <main className="empty-state">Загрузка документа...</main>;
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <button type="button" className="link-button" onClick={backToDashboard}>
            Мои документы
          </button>
          <h2>{activeDocument.title}</h2>
          <p>{saveStatusLabel(saveStatus)}</p>
        </div>
        <div className="toolbar">
          <button
            type="button"
            className="button button--ghost"
            onClick={() => void dispatch(saveActiveDocument())}
          >
            Сохранить
          </button>
          <button type="button" className="button button--ghost" onClick={exportCsv}>
            Экспорт CSV
          </button>
          <button type="button" className="button button--ghost" onClick={exportJson}>
            Экспорт JSON
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => fileInputRef.current?.click()}
          >
            Импорт CSV
          </button>
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';

              if (file) {
                void importCsv(file);
              }
            }}
          />
        </div>
      </header>
      {error ? <div className="alert alert--error">{error}</div> : null}
      <FormulaBar />
      <FormattingToolbar />
      <Grid />
    </main>
  );
}
