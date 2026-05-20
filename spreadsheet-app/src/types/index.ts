export type CellId = string;

export type CellValueType = 'empty' | 'string' | 'number' | 'boolean' | 'formula';

export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type SaveStatus = 'saved' | 'saving' | 'error';

export interface CellPosition {
  row: number;
  col: number;
}

export interface CellRange {
  start: CellId;
  end: CellId;
}

export interface CellData {
  id: CellId;
  value: string;
  computedValue: string;
  type: CellValueType;
}

export interface ClipboardData {
  rows: number;
  cols: number;
  values: string[][];
}

export interface SpreadsheetSnapshot {
  rowCount: number;
  colCount: number;
  cells: Record<CellId, CellData>;
  colWidths: Record<number, number>;
  rowHeights: Record<number, number>;
}

export interface SpreadsheetState extends SpreadsheetSnapshot {
  selectedCell: CellId | null;
  selectionRange: CellRange | null;
  editingCell: CellId | null;
  clipboard: ClipboardData | null;
  past: SpreadsheetSnapshot[];
  future: SpreadsheetSnapshot[];
}

export interface DocumentPreview {
  cells: string[][];
}

export interface SpreadsheetDocument {
  id: string;
  ownerId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  spreadsheet: SpreadsheetSnapshot;
}

export interface DocumentSummary {
  id: string;
  ownerId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  preview: DocumentPreview;
  rowCount: number;
  colCount: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
}

export interface AuthState {
  user: AuthUser;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface ApiErrorPayload {
  status: number;
  message: string;
}
