import type { SpreadsheetSnapshot } from '@/types';
import { createSnapshotFromCsvValues, formatCellDisplayValue } from '@/utils/spreadsheet';
import { toCellId } from '@/utils/formulas';

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }

      row.push(current);
      rows.push(row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  row.push(current);

  if (row.length > 1 || row[0].length > 0) {
    rows.push(row);
  }

  return rows;
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function spreadsheetToCsv(snapshot: SpreadsheetSnapshot): string {
  const lines: string[] = [];

  for (let row = 1; row <= snapshot.rowCount; row += 1) {
    const values: string[] = [];

    for (let col = 1; col <= snapshot.colCount; col += 1) {
      values.push(escapeCsvCell(formatCellDisplayValue(snapshot.cells[toCellId(row, col)])));
    }

    lines.push(values.join(','));
  }

  return lines.join('\n');
}

export function spreadsheetToJson(snapshot: SpreadsheetSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function csvToSpreadsheetSnapshot(text: string): SpreadsheetSnapshot {
  return createSnapshotFromCsvValues(parseCsv(text));
}

export function downloadTextFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
