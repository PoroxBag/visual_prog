import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CellId,
  CellRange,
  CellStyle,
  ClipboardData,
  SpreadsheetSnapshot,
  SpreadsheetState,
} from '@/types';
import { DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT, parseCellId, toCellId } from '@/utils/formulas';
import {
  applyCellStyleToCells,
  clearCellValue,
  clearCellsInBounds,
  cloneSpreadsheetSnapshot,
  createClipboardFromSelection,
  createSpreadsheetSnapshot,
  deleteColFromSnapshot,
  deleteRowFromSnapshot,
  getSelectionBounds,
  insertColInSnapshot,
  insertRowInSnapshot,
  pasteClipboardToCells,
  setCellValue,
  textToClipboard,
  toggleCellStyleInCells,
} from '@/utils/spreadsheet';

const HISTORY_LIMIT = 100;

function currentSnapshot(state: SpreadsheetState): SpreadsheetSnapshot {
  return {
    rowCount: state.rowCount,
    colCount: state.colCount,
    cells: state.cells,
    colWidths: state.colWidths,
    rowHeights: state.rowHeights,
  };
}

function applySnapshot(state: SpreadsheetState, snapshot: SpreadsheetSnapshot): void {
  state.rowCount = snapshot.rowCount;
  state.colCount = snapshot.colCount;
  state.cells = snapshot.cells;
  state.colWidths = snapshot.colWidths;
  state.rowHeights = snapshot.rowHeights;
}

function pushHistory(state: SpreadsheetState): void {
  state.past.push(cloneSpreadsheetSnapshot(currentSnapshot(state)));

  if (state.past.length > HISTORY_LIMIT) {
    state.past.shift();
  }

  state.future = [];
}

function clampSelectedCell(id: CellId, rowCount: number, colCount: number): CellId {
  const position = parseCellId(id);
  const row = Math.min(Math.max(position.row, 1), rowCount);
  const col = Math.min(Math.max(position.col, 1), colCount);
  return toCellId(row, col);
}

const initialSnapshot = createSpreadsheetSnapshot(1000, 26);

export const initialSpreadsheetState: SpreadsheetState = {
  ...initialSnapshot,
  selectedCell: 'A1',
  selectionRange: null,
  editingCell: null,
  clipboard: null,
  past: [],
  future: [],
};

export const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState: initialSpreadsheetState,
  reducers: {
    loadSpreadsheet(state, action: PayloadAction<SpreadsheetSnapshot>) {
      applySnapshot(state, cloneSpreadsheetSnapshot(action.payload));
      state.selectedCell = 'A1';
      state.selectionRange = null;
      state.editingCell = null;
      state.clipboard = null;
      state.past = [];
      state.future = [];
    },
    selectCell(state, action: PayloadAction<{ id: CellId }>) {
      state.selectedCell = action.payload.id;
      state.selectionRange = null;
    },
    selectRange(state, action: PayloadAction<CellRange>) {
      state.selectedCell = action.payload.end;
      state.selectionRange = action.payload;
    },
    selectAll(state) {
      state.selectedCell = 'A1';
      state.selectionRange = {
        start: 'A1',
        end: toCellId(state.rowCount, state.colCount),
      };
    },
    startEditing(state, action: PayloadAction<{ id: CellId }>) {
      state.editingCell = action.payload.id;
    },
    stopEditing(state) {
      state.editingCell = null;
    },
    updateCell(state, action: PayloadAction<{ id: CellId; value: string }>) {
      pushHistory(state);
      state.cells = setCellValue(state.cells, action.payload.id, action.payload.value);
      state.selectedCell = action.payload.id;
      state.selectionRange = null;
    },
    clearCell(state, action: PayloadAction<{ id: CellId }>) {
      pushHistory(state);
      state.cells = clearCellValue(state.cells, action.payload.id);
    },
    clearSelection(state) {
      const bounds = getSelectionBounds(state.selectedCell, state.selectionRange);

      if (!bounds) {
        return;
      }

      pushHistory(state);
      state.cells = clearCellsInBounds(state.cells, bounds, true);
    },
    cutSelection(state) {
      const bounds = getSelectionBounds(state.selectedCell, state.selectionRange);

      if (!bounds) {
        return;
      }

      pushHistory(state);
      state.clipboard = createClipboardFromSelection(state.cells, bounds);
      state.cells = clearCellsInBounds(state.cells, bounds, false);
    },
    setClipboard(state, action: PayloadAction<ClipboardData | null>) {
      state.clipboard = action.payload;
    },
    setClipboardFromSelection(state) {
      const bounds = getSelectionBounds(state.selectedCell, state.selectionRange);

      if (!bounds) {
        return;
      }

      state.clipboard = createClipboardFromSelection(state.cells, bounds);
    },
    setClipboardFromText(state, action: PayloadAction<string>) {
      state.clipboard = textToClipboard(action.payload);
    },
    pasteClipboard(state, action: PayloadAction<{ targetId?: CellId } | undefined>) {
      if (!state.clipboard || !state.selectedCell) {
        return;
      }

      pushHistory(state);
      const targetId = action.payload?.targetId ?? state.selectedCell;
      state.cells = pasteClipboardToCells(state.cells, state.clipboard, targetId);
      state.selectedCell = targetId;
      state.selectionRange = {
        start: targetId,
        end: toCellId(
          parseCellId(targetId).row + state.clipboard.rows - 1,
          parseCellId(targetId).col + state.clipboard.cols - 1,
        ),
      };
    },
    applyCellStyle(state, action: PayloadAction<CellStyle>) {
      const bounds = getSelectionBounds(state.selectedCell, state.selectionRange);

      if (!bounds) {
        return;
      }

      pushHistory(state);
      state.cells = applyCellStyleToCells(state.cells, bounds, action.payload);
    },
    toggleCellStyle(state, action: PayloadAction<{ key: 'bold' | 'italic' | 'underline' }>) {
      const bounds = getSelectionBounds(state.selectedCell, state.selectionRange);

      if (!bounds) {
        return;
      }

      pushHistory(state);
      state.cells = toggleCellStyleInCells(state.cells, bounds, action.payload.key);
    },
    resizeCol(state, action: PayloadAction<{ index: number; width: number }>) {
      state.colWidths[action.payload.index] = Math.max(48, action.payload.width);
    },
    resizeRow(state, action: PayloadAction<{ index: number; height: number }>) {
      state.rowHeights[action.payload.index] = Math.max(22, action.payload.height);
    },
    insertRow(state, action: PayloadAction<{ index: number }>) {
      pushHistory(state);
      applySnapshot(state, insertRowInSnapshot(currentSnapshot(state), action.payload.index));
      state.selectedCell = toCellId(action.payload.index, 1);
      state.selectionRange = null;
    },
    deleteRow(state, action: PayloadAction<{ index: number }>) {
      pushHistory(state);
      applySnapshot(state, deleteRowFromSnapshot(currentSnapshot(state), action.payload.index));

      if (state.selectedCell) {
        state.selectedCell = clampSelectedCell(state.selectedCell, state.rowCount, state.colCount);
      }

      state.selectionRange = null;
    },
    insertCol(state, action: PayloadAction<{ index: number }>) {
      pushHistory(state);
      applySnapshot(state, insertColInSnapshot(currentSnapshot(state), action.payload.index));
      state.selectedCell = toCellId(1, action.payload.index);
      state.selectionRange = null;
    },
    deleteCol(state, action: PayloadAction<{ index: number }>) {
      pushHistory(state);
      applySnapshot(state, deleteColFromSnapshot(currentSnapshot(state), action.payload.index));

      if (state.selectedCell) {
        state.selectedCell = clampSelectedCell(state.selectedCell, state.rowCount, state.colCount);
      }

      state.selectionRange = null;
    },
    moveSelection(state, action: PayloadAction<{ rowDelta: number; colDelta: number }>) {
      if (!state.selectedCell) {
        state.selectedCell = 'A1';
        return;
      }

      const current = parseCellId(state.selectedCell);
      const row = Math.min(Math.max(current.row + action.payload.rowDelta, 1), state.rowCount);
      const col = Math.min(Math.max(current.col + action.payload.colDelta, 1), state.colCount);
      state.selectedCell = toCellId(row, col);
      state.selectionRange = null;
    },
    undo(state) {
      const previous = state.past.pop();

      if (!previous) {
        return;
      }

      state.future.push(cloneSpreadsheetSnapshot(currentSnapshot(state)));
      applySnapshot(state, previous);
      state.editingCell = null;
    },
    redo(state) {
      const next = state.future.pop();

      if (!next) {
        return;
      }

      state.past.push(cloneSpreadsheetSnapshot(currentSnapshot(state)));
      applySnapshot(state, next);
      state.editingCell = null;
    },
  },
});

export const {
  applyCellStyle,
  clearCell,
  clearSelection,
  cutSelection,
  deleteCol,
  deleteRow,
  insertCol,
  insertRow,
  loadSpreadsheet,
  moveSelection,
  pasteClipboard,
  redo,
  resizeCol,
  resizeRow,
  selectAll,
  selectCell,
  selectRange,
  setClipboard,
  setClipboardFromSelection,
  setClipboardFromText,
  startEditing,
  stopEditing,
  toggleCellStyle,
  undo,
  updateCell,
} = spreadsheetSlice.actions;

export function selectColWidth(state: SpreadsheetState, index: number): number {
  return state.colWidths[index] ?? DEFAULT_COL_WIDTH;
}

export function selectRowHeight(state: SpreadsheetState, index: number): number {
  return state.rowHeights[index] ?? DEFAULT_ROW_HEIGHT;
}

export const spreadsheetReducer = spreadsheetSlice.reducer;
