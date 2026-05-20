import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { applyCellStyle, toggleCellStyle } from '@/features/spreadsheet/spreadsheetSlice';
import type { HorizontalAlign, NumberFormat } from '@/types';
import { normalizeCellStyle } from '@/utils/spreadsheet';

const textColors = ['#111827', '#dc2626', '#2563eb', '#047857', '#7c3aed'];
const backgroundColors = ['#ffffff', '#fef3c7', '#dbeafe', '#dcfce7', '#fee2e2'];

export function FormattingToolbar() {
  const dispatch = useAppDispatch();
  const selectedCell = useAppSelector((state) => state.spreadsheet.selectedCell);
  const cell = useAppSelector((state) => (selectedCell ? state.spreadsheet.cells[selectedCell] : undefined));
  const style = useMemo(() => normalizeCellStyle(cell?.style), [cell?.style]);

  const setAlign = (horizontalAlign: HorizontalAlign) => {
    dispatch(applyCellStyle({ horizontalAlign }));
  };

  const setNumberFormat = (numberFormat: NumberFormat) => {
    dispatch(applyCellStyle({ numberFormat }));
  };

  return (
    <section className="format-toolbar" aria-label="Панель форматирования">
      <div className="format-toolbar__group" aria-label="Стиль текста">
        <button
          type="button"
          className={style.bold ? 'format-button is-active' : 'format-button'}
          onClick={() => dispatch(toggleCellStyle({ key: 'bold' }))}
        >
          B
        </button>
        <button
          type="button"
          className={style.italic ? 'format-button is-active' : 'format-button'}
          onClick={() => dispatch(toggleCellStyle({ key: 'italic' }))}
        >
          I
        </button>
        <button
          type="button"
          className={style.underline ? 'format-button is-active' : 'format-button'}
          onClick={() => dispatch(toggleCellStyle({ key: 'underline' }))}
        >
          U
        </button>
      </div>

      <div className="format-toolbar__group" aria-label="Цвет текста">
        <span>Текст</span>
        {textColors.map((color) => (
          <button
            key={color}
            type="button"
            className={style.textColor === color ? 'color-button is-active' : 'color-button'}
            style={{ backgroundColor: color }}
            onClick={() => dispatch(applyCellStyle({ textColor: color }))}
            aria-label={`Цвет текста ${color}`}
          />
        ))}
      </div>

      <div className="format-toolbar__group" aria-label="Цвет фона">
        <span>Фон</span>
        {backgroundColors.map((color) => (
          <button
            key={color}
            type="button"
            className={style.backgroundColor === color ? 'color-button is-active' : 'color-button'}
            style={{ backgroundColor: color }}
            onClick={() => dispatch(applyCellStyle({ backgroundColor: color }))}
            aria-label={`Цвет фона ${color}`}
          />
        ))}
      </div>

      <div className="format-toolbar__group" aria-label="Выравнивание">
        <button
          type="button"
          className={style.horizontalAlign === 'left' ? 'format-button is-active' : 'format-button'}
          onClick={() => setAlign('left')}
        >
          Лево
        </button>
        <button
          type="button"
          className={style.horizontalAlign === 'center' ? 'format-button is-active' : 'format-button'}
          onClick={() => setAlign('center')}
        >
          Центр
        </button>
        <button
          type="button"
          className={style.horizontalAlign === 'right' ? 'format-button is-active' : 'format-button'}
          onClick={() => setAlign('right')}
        >
          Право
        </button>
      </div>

      <label className="format-toolbar__select">
        Формат
        <select
          value={style.numberFormat}
          onChange={(event) => setNumberFormat(event.target.value as NumberFormat)}
        >
          <option value="plain">Число</option>
          <option value="percent">Процент</option>
          <option value="currency">Валюта</option>
          <option value="date">Дата</option>
        </select>
      </label>
    </section>
  );
}
