import type {
  CellData,
  CellId,
  CellRange,
  CellStyle,
  ClipboardData,
  HorizontalAlign,
  NumberFormat,
  SpreadsheetSnapshot,
} from '@/types';
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

export const defaultCellStyle: Required<CellStyle> = {
  bold: false,
  italic: false,
  underline: false,
  textColor: '#111827',
  backgroundColor: '#ffffff',
  horizontalAlign: 'left',
  numberFormat: 'plain',
};

export function normalizeCellStyle(style?: CellStyle): Required<CellStyle> {
  return {
    ...defaultCellStyle,
    ...style,
  };
}

function cloneStyle(style?: CellStyle): CellStyle | undefined {
  return style ? { ...style } : undefined;
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
    cells: Object.fromEntries(
      Object.entries(snapshot.cells).map(([id, cell]) => [
        id,
        {
          ...cell,
          style: cloneStyle(cell.style),
        },
      ]),
    ),
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
  const clipboardCells: ClipboardData['cells'] = [];

  for (let row = bounds.startRow; row <= bounds.endRow; row += 1) {
    const currentRow: ClipboardData['cells'][number] = [];

    for (let col = bounds.startCol; col <= bounds.endCol; col += 1) {
      const cell = cells[toCellId(row, col)];
      currentRow.push({
        value: cell?.value ?? '',
        style: cloneStyle(cell?.style),
      });
    }

    clipboardCells.push(currentRow);
  }

  return {
    rows: clipboardCells.length,
    cols: clipboardCells[0]?.length ?? 0,
    cells: clipboardCells,
  };
}

export function clipboardToText(clipboard: ClipboardData): string {
  return clipboard.cells.map((row) => row.map((cell) => cell.value).join('\t')).join('\n');
}

export function textToClipboard(text: string): ClipboardData {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = normalized.endsWith('\n') ? normalized.slice(0, -1).split('\n') : normalized.split('\n');
  const values = rows.map((row) => row.split('\t'));
  const colCount = Math.max(...values.map((row) => row.length), 0);
  const clipboardCells = values.map((row) => [
    ...row.map((value) => ({ value })),
    ...Array.from({ length: colCount - row.length }, () => ({ value: '' })),
  ]);

  return {
    rows: clipboardCells.length,
    cols: colCount,
    cells: clipboardCells,
  };
}

export function pasteClipboardToCells(
  cells: Record<CellId, CellData>,
  clipboard: ClipboardData,
  targetId: CellId,
): Record<CellId, CellData> {
  const target = parseCellId(targetId);
  const nextCells = { ...cells };

  clipboard.cells.forEach((rowCells, rowOffset) => {
    rowCells.forEach((clipboardCell, colOffset) => {
      const id = toCellId(target.row + rowOffset, target.col + colOffset);

      if (clipboardCell.value.length === 0 && !clipboardCell.style) {
        delete nextCells[id];
        return;
      }

      const existingStyle = nextCells[id]?.style;
      nextCells[id] = createCell(
        id,
        clipboardCell.value,
        nextCells,
        cloneStyle(clipboardCell.style ?? existingStyle),
      );
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
  const existingStyle = nextCells[id]?.style;

  if (value.trim().length === 0) {
    if (existingStyle) {
      nextCells[id] = createCell(id, '', nextCells, cloneStyle(existingStyle));
      return recalculateCells(nextCells);
    }

    delete nextCells[id];
    return recalculateCells(nextCells);
  }

  nextCells[id] = createCell(id, value, nextCells, cloneStyle(existingStyle));
  return recalculateCells(nextCells);
}

export function clearCellValue(cells: Record<CellId, CellData>, id: CellId): Record<CellId, CellData> {
  const nextCells = { ...cells };
  const existingStyle = nextCells[id]?.style;

  if (existingStyle) {
    nextCells[id] = createCell(id, '', nextCells, cloneStyle(existingStyle));
  } else {
    delete nextCells[id];
  }

  return recalculateCells(nextCells);
}

export function clearCellsInBounds(
  cells: Record<CellId, CellData>,
  bounds: SelectionBounds,
  preserveStyle: boolean,
): Record<CellId, CellData> {
  const nextCells = { ...cells };

  for (let row = bounds.startRow; row <= bounds.endRow; row += 1) {
    for (let col = bounds.startCol; col <= bounds.endCol; col += 1) {
      const id = toCellId(row, col);
      const existingStyle = nextCells[id]?.style;

      if (preserveStyle && existingStyle) {
        nextCells[id] = createCell(id, '', nextCells, cloneStyle(existingStyle));
      } else {
        delete nextCells[id];
      }
    }
  }

  return recalculateCells(nextCells);
}

export function applyCellStyleToCells(
  cells: Record<CellId, CellData>,
  bounds: SelectionBounds,
  style: CellStyle,
): Record<CellId, CellData> {
  const nextCells = { ...cells };

  for (let row = bounds.startRow; row <= bounds.endRow; row += 1) {
    for (let col = bounds.startCol; col <= bounds.endCol; col += 1) {
      const id = toCellId(row, col);
      const cell = nextCells[id] ?? createCell(id, '', nextCells);
      nextCells[id] = {
        ...cell,
        style: {
          ...cell.style,
          ...style,
        },
      };
    }
  }

  return recalculateCells(nextCells);
}

export function toggleCellStyleInCells(
  cells: Record<CellId, CellData>,
  bounds: SelectionBounds,
  key: 'bold' | 'italic' | 'underline',
): Record<CellId, CellData> {
  const nextCells = { ...cells };
  const firstCell = nextCells[toCellId(bounds.startRow, bounds.startCol)];
  const firstStyle = normalizeCellStyle(firstCell?.style);
  const nextValue = !firstStyle[key];

  for (let row = bounds.startRow; row <= bounds.endRow; row += 1) {
    for (let col = bounds.startCol; col <= bounds.endCol; col += 1) {
      const id = toCellId(row, col);
      const cell = nextCells[id] ?? createCell(id, '', nextCells);
      nextCells[id] = {
        ...cell,
        style: {
          ...cell.style,
          [key]: nextValue,
        },
      };
    }
  }

  return recalculateCells(nextCells);
}

export function formatCellDisplayValue(cell?: CellData): string {
  if (!cell) {
    return '';
  }

  const style = normalizeCellStyle(cell.style);
  const value = cell.computedValue;

  if (value.length === 0 || value.startsWith('#')) {
    return value;
  }

  if (style.numberFormat === 'plain') {
    return value;
  }

  if (style.numberFormat === 'date') {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('ru-RU').format(date);
  }

  const numericValue = Number(value.replace(',', '.'));

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  if (style.numberFormat === 'percent') {
    return new Intl.NumberFormat('ru-RU', {
      style: 'percent',
      maximumFractionDigits: 2,
    }).format(numericValue);
  }

  if (style.numberFormat === 'currency') {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 2,
    }).format(numericValue);
  }

  return value;
}

export function isHorizontalAlign(value: string): value is HorizontalAlign {
  return value === 'left' || value === 'center' || value === 'right';
}

export function isNumberFormat(value: string): value is NumberFormat {
  return value === 'plain' || value === 'percent' || value === 'currency' || value === 'date';
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
      currentRow.push(formatCellDisplayValue(snapshot.cells[toCellId(row, col)]));
    }

    rows.push(currentRow);
  }

  return rows;
}
