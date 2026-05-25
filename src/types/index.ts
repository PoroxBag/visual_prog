export type CellId = string;

export type CellValueType = 'empty' | 'string' | 'number' | 'boolean' | 'formula';

export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type SaveStatus = 'saved' | 'saving' | 'error';

export type HorizontalAlign = 'left' | 'center' | 'right';

export type NumberFormat = 'plain' | 'percent' | 'currency' | 'date';

export interface CellPosition {
  row: number;
  col: number;
}

export interface CellRange {
  start: CellId;
  end: CellId;
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textColor?: string;
  backgroundColor?: string;
  horizontalAlign?: HorizontalAlign;
  numberFormat?: NumberFormat;
}

export interface CellData {
  id: CellId;
  value: string;
  computedValue: string;
  type: CellValueType;
  style?: CellStyle;
}

export interface ClipboardCell {
  value: string;
  style?: CellStyle;
}

export interface ClipboardData {
  rows: number;
  cols: number;
  cells: ClipboardCell[][];
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
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession extends AuthTokens {
  user: AuthUser;
}

export interface ApiErrorPayload {
  status: number;
  message: string;
}
