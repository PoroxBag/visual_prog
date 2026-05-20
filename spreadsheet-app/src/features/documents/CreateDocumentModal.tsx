import { useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { createDocument } from '@/features/documents/documentsSlice';
import { loadSpreadsheet } from '@/features/spreadsheet/spreadsheetSlice';
import { closeCreateDocumentModal, openSpreadsheet } from '@/features/ui/uiSlice';

export function CreateDocumentModal() {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('Новая таблица');
  const [rowCount, setRowCount] = useState(100);
  const [colCount, setColCount] = useState(26);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const create = async () => {
    setIsSubmitting(true);

    try {
      const document = await dispatch(
        createDocument({ title, rowCount: Math.max(1, rowCount), colCount: Math.max(1, colCount) }),
      ).unwrap();
      dispatch(loadSpreadsheet(document.spreadsheet));
      dispatch(closeCreateDocumentModal());
      dispatch(openSpreadsheet());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={() => dispatch(closeCreateDocumentModal())}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Создание документа"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2>Новый документ</h2>
        <label className="field">
          <span>Название</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <div className="modal-grid">
          <label className="field">
            <span>Строки</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={rowCount}
              onChange={(event) => setRowCount(Number(event.target.value))}
            />
          </label>
          <label className="field">
            <span>Столбцы</span>
            <input
              type="number"
              min={1}
              max={200}
              value={colCount}
              onChange={(event) => setColCount(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={() => dispatch(closeCreateDocumentModal())}
          >
            Отмена
          </button>
          <button type="button" className="button" disabled={isSubmitting} onClick={() => void create()}>
            Создать
          </button>
        </div>
      </section>
    </div>
  );
}
