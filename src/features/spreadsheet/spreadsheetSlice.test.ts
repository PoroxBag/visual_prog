import { describe, expect, it } from 'vitest';
import {
  applyCellStyle,
  pasteClipboard,
  selectCell,
  selectRange,
  setClipboardFromSelection,
  spreadsheetReducer,
  toggleCellStyle,
  undo,
  updateCell,
} from '@/features/spreadsheet/spreadsheetSlice';

const reduce = spreadsheetReducer;

describe('spreadsheetSlice', () => {
  it('copies and pastes a selected range into the target position', () => {
    let state = reduce(undefined, updateCell({ id: 'A1', value: '1' }));
    state = reduce(state, updateCell({ id: 'A2', value: '2' }));
    state = reduce(state, updateCell({ id: 'B1', value: '3' }));
    state = reduce(state, updateCell({ id: 'B2', value: '4' }));
    state = reduce(state, selectCell({ id: 'A1' }));
    state = reduce(state, selectRange({ start: 'A1', end: 'B2' }));
    state = reduce(state, setClipboardFromSelection());
    state = reduce(state, selectCell({ id: 'A6' }));
    state = reduce(state, pasteClipboard({ targetId: 'A6' }));

    expect(state.cells.A6?.value).toBe('1');
    expect(state.cells.A7?.value).toBe('2');
    expect(state.cells.B6?.value).toBe('3');
    expect(state.cells.B7?.value).toBe('4');
  });

  it('copies cell styles with selected range', () => {
    let state = reduce(undefined, updateCell({ id: 'A1', value: '100' }));
    state = reduce(state, selectCell({ id: 'A1' }));
    state = reduce(state, toggleCellStyle({ key: 'bold' }));
    state = reduce(state, applyCellStyle({ textColor: '#dc2626', numberFormat: 'currency' }));
    state = reduce(state, setClipboardFromSelection());
    state = reduce(state, selectCell({ id: 'C3' }));
    state = reduce(state, pasteClipboard({ targetId: 'C3' }));

    expect(state.cells.C3?.value).toBe('100');
    expect(state.cells.C3?.style?.bold).toBe(true);
    expect(state.cells.C3?.style?.textColor).toBe('#dc2626');
    expect(state.cells.C3?.style?.numberFormat).toBe('currency');
  });

  it('undo restores the previous spreadsheet snapshot', () => {
    let state = reduce(undefined, updateCell({ id: 'A1', value: '10' }));
    state = reduce(state, updateCell({ id: 'A1', value: '20' }));
    state = reduce(state, undo());

    expect(state.cells.A1?.value).toBe('10');
  });
});
