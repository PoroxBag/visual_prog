import type { CellData, CellId, CellRange, ClipboardData, SpreadsheetSnapshot } from '@/types';
import {
  DEFAULT_COL_COUNT,
  DEFAULT_ROW_COUNT,
  createCell,
  parseCellId,
  recalculateCells,
  shiftCellsAfterColDelete,
  shiftCellsAfterColInsert,
  shiftCellsAfterRowDelete,
  shiftCellsAfterRowInsert,
  toCellId,
} from '@/utils/formulas';

export interface SelectionBounds {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

export function createSpreadsheetSnapshot(
  rowCount = DEFAULT_ROW_COUNT,
  colCount = DEFAULT_COL_COUNT,
): SpreadsheetSnapshot {
  return {
    rowCount,
    colCount,
    cells: {},
    colWidths: {},
    rowHeights: {},
  };
}

export function cloneSpreadsheetSnapshot(snapshot: SpreadsheetSnapshot): SpreadsheetSnapshot {
  return {
    rowCount: snapshot.rowCount,
    colCount: snapshot.colCount,
    cells: Object.fromEntries(Object.entries(snapshot.cells).map(([id, cell]) => [id, { ...cell }])),
    colWidths: { ...snapshot.colWidths },
    rowHeights: { ...snapshot.rowHeights },
  };
}

export function createSnapshotFromCsvValues(values: string[][]): SpreadsheetSnapshot {
  const rowCount = Math.max(values.length, 1);
  const colCount = Math.max(...values.map((row) => row.length), 1);
  const cells: Record<CellId, CellData> = {};

  values.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value.trim().length > 0) {
        const id = toCellId(rowIndex + 1, colIndex + 1);
        cells[id] = createCell(id, value, cells);
      }
    });
  });

  return {
    rowCount,
    colCount,
    cells: recalculateCells(cells),
    colWidths: {},
    rowHeights: {},
  };
}

export function getSelectionBounds(
  selectedCell: CellId | null,
  range: CellRange | null,
): SelectionBounds | null {
  if (!selectedCell) {
    return null;
  }

  const startPosition = parseCellId(range?.start ?? selectedCell);
  const endPosition = parseCellId(range?.end ?? selectedCell);

  return {
    startRow: Math.min(startPosition.row, endPosition.row),
    endRow: Math.max(startPosition.row, endPosition.row),
    startCol: Math.min(startPosition.col, endPosition.col),
    endCol: Math.max(startPosition.col, endPosition.col),
  };
}

export function createClipboardFromSelection(
  cells: Record<CellId, CellData>,
  bounds: SelectionBounds,
): ClipboardData {
  const values: string[][] = [];

  for (let row = bounds.startRow; row <= bounds.endRow; row += 1) {
    const currentRow: string[] = [];

    for (let col = bounds.startCol; col <= bounds.endCol; col += 1) {
      currentRow.push(cells[toCellId(row, col)]?.value ?? '');
    }

    values.push(currentRow);
  }

  return {
    rows: values.length,
    cols: values[0]?.length ?? 0,
    values,
  };
}

export function clipboardToText(clipboard: ClipboardData): string {
  return clipboard.values.map((row) => row.join('\t')).join('\n');
}

export function textToClipboard(text: string): ClipboardData {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = normalized.endsWith('\n') ? normalized.slice(0, -1).split('\n') : normalized.split('\n');
  const values = rows.map((row) => row.split('\t'));
  const colCount = Math.max(...values.map((row) => row.length), 0);
  const normalizedValues = values.map((row) => [
    ...row,
    ...Array.from({ length: colCount - row.length }, () => ''),
  ]);

  return {
    rows: normalizedValues.length,
    cols: colCount,
    values: normalizedValues,
  };
}

export function pasteClipboardToCells(
  cells: Record<CellId, CellData>,
  clipboard: ClipboardData,
  targetId: CellId,
): Record<CellId, CellData> {
  const target = parseCellId(targetId);
  const nextCells = { ...cells };

  clipboard.values.forEach((rowValues, rowOffset) => {
    rowValues.forEach((value, colOffset) => {
      const id = toCellId(target.row + rowOffset, target.col + colOffset);

      if (value.length === 0) {
        delete nextCells[id];
        return;
      }

      nextCells[id] = createCell(id, value, nextCells);
    });
  });

  return recalculateCells(nextCells);
}

export function setCellValue(
  cells: Record<CellId, CellData>,
  id: CellId,
  value: string,
): Record<CellId, CellData> {
  const nextCells = { ...cells };

  if (value.trim().length === 0) {
    delete nextCells[id];
    return recalculateCells(nextCells);
  }

  nextCells[id] = createCell(id, value, nextCells);
  return recalculateCells(nextCells);
}

export function clearCellValue(cells: Record<CellId, CellData>, id: CellId): Record<CellId, CellData> {
  const nextCells = { ...cells };
  delete nextCells[id];
  return recalculateCells(nextCells);
}

export function insertRowInSnapshot(snapshot: SpreadsheetSnapshot, index: number): SpreadsheetSnapshot {
  const rowHeights: Record<number, number> = {};

  Object.entries(snapshot.rowHeights).forEach(([key, height]) => {
    const row = Number(key);
    rowHeights[row >= index ? row + 1 : row] = height;
  });

  return {
    ...snapshot,
    rowCount: snapshot.rowCount + 1,
    cells: shiftCellsAfterRowInsert(snapshot.cells, index),
    rowHeights,
  };
}

export function deleteRowFromSnapshot(snapshot: SpreadsheetSnapshot, index: number): SpreadsheetSnapshot {
  const rowHeights: Record<number, number> = {};

  Object.entries(snapshot.rowHeights).forEach(([key, height]) => {
    const row = Number(key);

    if (row !== index) {
      rowHeights[row > index ? row - 1 : row] = height;
    }
  });

  return {
    ...snapshot,
    rowCount: Math.max(1, snapshot.rowCount - 1),
    cells: shiftCellsAfterRowDelete(snapshot.cells, index),
    rowHeights,
  };
}

export function insertColInSnapshot(snapshot: SpreadsheetSnapshot, index: number): SpreadsheetSnapshot {
  const colWidths: Record<number, number> = {};

  Object.entries(snapshot.colWidths).forEach(([key, width]) => {
    const col = Number(key);
    colWidths[col >= index ? col + 1 : col] = width;
  });

  return {
    ...snapshot,
    colCount: snapshot.colCount + 1,
    cells: shiftCellsAfterColInsert(snapshot.cells, index),
    colWidths,
  };
}

export function deleteColFromSnapshot(snapshot: SpreadsheetSnapshot, index: number): SpreadsheetSnapshot {
  const colWidths: Record<number, number> = {};

  Object.entries(snapshot.colWidths).forEach(([key, width]) => {
    const col = Number(key);

    if (col !== index) {
      colWidths[col > index ? col - 1 : col] = width;
    }
  });

  return {
    ...snapshot,
    colCount: Math.max(1, snapshot.colCount - 1),
    cells: shiftCellsAfterColDelete(snapshot.cells, index),
    colWidths,
  };
}

export function spreadsheetPreview(snapshot: SpreadsheetSnapshot): string[][] {
  const rows: string[][] = [];

  for (let row = 1; row <= 3; row += 1) {
    const currentRow: string[] = [];

    for (let col = 1; col <= 3; col += 1) {
      currentRow.push(snapshot.cells[toCellId(row, col)]?.computedValue ?? '');
    }

    rows.push(currentRow);
  }

  return rows;
}
