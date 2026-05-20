import { useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { FormulaBar } from '@/components/FormulaBar';
import { Grid } from '@/components/Grid';
import {
  fetchDocuments,
  replaceActiveSpreadsheet,
  saveActiveDocument,
} from '@/features/documents/documentsSlice';
import { loadSpreadsheet } from '@/features/spreadsheet/spreadsheetSlice';
import { openDashboard } from '@/features/ui/uiSlice';
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

export function SpreadsheetPage() {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeDocument = useAppSelector((state) => state.documents.activeDocument);
  const saveStatus = useAppSelector((state) => state.documents.saveStatus);
  const spreadsheet = useAppSelector((state) => state.spreadsheet);

  const backToDashboard = () => {
    if (saveStatus !== 'saved' && !window.confirm('Есть несохранённые изменения. Покинуть документ?')) {
      return;
    }

    dispatch(openDashboard());
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

  if (!activeDocument) {
    return (
      <main className="empty-page">
        <h1>Документ не выбран</h1>
        <button type="button" className="button" onClick={() => dispatch(openDashboard())}>
          К списку документов
        </button>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <button type="button" className="link-button" onClick={backToDashboard}>
            Мои документы
          </button>
          <h1>{activeDocument.title}</h1>
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
      <FormulaBar />
      <Grid />
    </main>
  );
}
