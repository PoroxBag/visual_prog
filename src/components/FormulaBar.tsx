import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { updateCell } from '@/features/spreadsheet/spreadsheetSlice';

export function FormulaBar() {
  const dispatch = useAppDispatch();
  const selectedCell = useAppSelector((state) => state.spreadsheet.selectedCell);
  const value = useAppSelector((state) =>
    selectedCell ? (state.spreadsheet.cells[selectedCell]?.value ?? '') : '',
  );
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value, selectedCell]);

  const commit = useCallback(() => {
    if (selectedCell) {
      dispatch(updateCell({ id: selectedCell, value: draft }));
    }
  }, [dispatch, draft, selectedCell]);

  return (
    <section className="formula-bar" aria-label="Панель формул">
      <div className="formula-bar__cell">{selectedCell ?? ''}</div>
      <div className="formula-bar__fx">fx</div>
      <input
        className="formula-bar__input"
        value={draft}
        disabled={!selectedCell}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
        }}
        placeholder="Выберите ячейку и введите значение или формулу"
      />
    </section>
  );
}
