import type { CellData, CellId, CellPosition, CellValueType } from '@/types';

const CELL_REFERENCE_PATTERN = /\b([A-Z]+)(\d+)\b/g;
const FUNCTION_PATTERN = /(SUM|AVERAGE|MAX|MIN|COUNT)\(([^()]+)\)/gi;

export const DEFAULT_COL_COUNT = 26;
export const DEFAULT_ROW_COUNT = 100;
export const DEFAULT_COL_WIDTH = 100;
export const DEFAULT_ROW_HEIGHT = 28;
export const ROW_HEADER_WIDTH = 48;

export function columnIndexToName(index: number): string {
  if (!Number.isInteger(index) || index < 1) {
    throw new Error(`Column index must be a positive integer. Received: ${index}`);
  }

  let current = index;
  let name = '';

  while (current > 0) {
    current -= 1;
    name = String.fromCharCode(65 + (current % 26)) + name;
    current = Math.floor(current / 26);
  }

  return name;
}

export function columnNameToIndex(name: string): number {
  const normalized = name.trim().toUpperCase();

  if (!/^[A-Z]+$/.test(normalized)) {
    throw new Error(`Invalid column name: ${name}`);
  }

  return normalized.split('').reduce((result, char) => result * 26 + char.charCodeAt(0) - 64, 0);
}

export function toCellId(row: number, col: number): CellId {
  return `${columnIndexToName(col)}${row}`;
}

export function parseCellId(id: CellId): CellPosition {
  const match = /^([A-Z]+)(\d+)$/.exec(id.toUpperCase());

  if (!match) {
    throw new Error(`Invalid cell id: ${id}`);
  }

  return {
    col: columnNameToIndex(match[1]),
    row: Number(match[2]),
  };
}

export function detectCellType(value: string): CellValueType {
  const normalized = value.trim();

  if (normalized.length === 0) {
    return 'empty';
  }

  if (normalized.startsWith('=')) {
    return 'formula';
  }

  if (/^(true|false)$/i.test(normalized)) {
    return 'boolean';
  }

  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    return 'number';
  }

  return 'string';
}

export function expandRange(range: string): CellId[] {
  const [startRaw, endRaw] = range.split(':').map((part) => part.trim().toUpperCase());

  if (!startRaw || !endRaw) {
    return [];
  }

  const start = parseCellId(startRaw);
  const end = parseCellId(endRaw);
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  const result: CellId[] = [];

  for (let row = minRow; row <= maxRow; row += 1) {
    for (let col = minCol; col <= maxCol; col += 1) {
      result.push(toCellId(row, col));
    }
  }

  return result;
}

export function isCellInRange(cellId: CellId, startId: CellId, endId: CellId): boolean {
  const cell = parseCellId(cellId);
  const start = parseCellId(startId);
  const end = parseCellId(endId);

  return (
    cell.row >= Math.min(start.row, end.row) &&
    cell.row <= Math.max(start.row, end.row) &&
    cell.col >= Math.min(start.col, end.col) &&
    cell.col <= Math.max(start.col, end.col)
  );
}

function toNumericValue(value: string): number {
  const normalized = value.trim();

  if (/^true$/i.test(normalized)) {
    return 1;
  }

  if (/^false$/i.test(normalized) || normalized.length === 0) {
    return 0;
  }

  const parsed = Number(normalized.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatFormulaResult(value: number): string {
  if (!Number.isFinite(value)) {
    return '#ERROR!';
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return String(Number(value.toFixed(10)));
}

function tokenizeMathExpression(expression: string): string[] {
  const result: string[] = [];
  let current = '';

  for (let index = 0; index < expression.length; index += 1) {
    const char = expression[index];

    if (/\s/.test(char)) {
      continue;
    }

    if (/\d|\./.test(char)) {
      current += char;
      continue;
    }

    if (current) {
      result.push(current);
      current = '';
    }

    if ('+-*/()'.includes(char)) {
      result.push(char);
      continue;
    }

    throw new Error(`Unsupported character in formula: ${char}`);
  }

  if (current) {
    result.push(current);
  }

  return result;
}

function toReversePolishNotation(tokens: string[]): string[] {
  const output: string[] = [];
  const operators: string[] = [];
  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  };

  tokens.forEach((token, index) => {
    if (/^-?\d+(\.\d+)?$/.test(token)) {
      output.push(token);
      return;
    }

    if (token === '-' && (index === 0 || ['+', '-', '*', '/', '('].includes(tokens[index - 1]))) {
      output.push('0');
    }

    if (token in precedence) {
      while (
        operators.length > 0 &&
        operators[operators.length - 1] in precedence &&
        precedence[operators[operators.length - 1]] >= precedence[token]
      ) {
        output.push(operators.pop() as string);
      }

      operators.push(token);
      return;
    }

    if (token === '(') {
      operators.push(token);
      return;
    }

    if (token === ')') {
      while (operators.length > 0 && operators[operators.length - 1] !== '(') {
        output.push(operators.pop() as string);
      }

      if (operators.pop() !== '(') {
        throw new Error('Mismatched parentheses');
      }
    }
  });

  while (operators.length > 0) {
    const operator = operators.pop() as string;

    if (operator === '(' || operator === ')') {
      throw new Error('Mismatched parentheses');
    }

    output.push(operator);
  }

  return output;
}

function calculateReversePolishNotation(tokens: string[]): number {
  const stack: number[] = [];

  tokens.forEach((token) => {
    if (/^-?\d+(\.\d+)?$/.test(token)) {
      stack.push(Number(token));
      return;
    }

    const right = stack.pop();
    const left = stack.pop();

    if (left === undefined || right === undefined) {
      throw new Error('Invalid expression');
    }

    switch (token) {
      case '+':
        stack.push(left + right);
        break;
      case '-':
        stack.push(left - right);
        break;
      case '*':
        stack.push(left * right);
        break;
      case '/':
        stack.push(left / right);
        break;
      default:
        throw new Error(`Unsupported operator: ${token}`);
    }
  });

  if (stack.length !== 1) {
    throw new Error('Invalid expression');
  }

  return stack[0];
}

function calculateMathExpression(expression: string): number {
  const tokens = tokenizeMathExpression(expression);
  const rpn = toReversePolishNotation(tokens);
  return calculateReversePolishNotation(rpn);
}

function getCellComputedValue(
  cellId: CellId,
  cells: Record<CellId, CellData>,
  visiting: Set<CellId>,
): string {
  const cell = cells[cellId];

  if (!cell) {
    return '0';
  }

  if (!cell.value.startsWith('=')) {
    return cell.value;
  }

  if (visiting.has(cellId)) {
    return '#CYCLE!';
  }

  visiting.add(cellId);
  const result = evaluateFormula(cell.value, cells, visiting);
  visiting.delete(cellId);

  return result;
}

function parseFunctionArguments(args: string): string[] {
  return args
    .split(/[,;]/)
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);
}

function calculateFunction(
  functionName: string,
  args: string,
  cells: Record<CellId, CellData>,
  visiting: Set<CellId>,
): string {
  const values: number[] = [];

  parseFunctionArguments(args).forEach((arg) => {
    if (/^[A-Z]+\d+:[A-Z]+\d+$/.test(arg)) {
      expandRange(arg).forEach((cellId) => {
        values.push(toNumericValue(getCellComputedValue(cellId, cells, visiting)));
      });
      return;
    }

    if (/^[A-Z]+\d+$/.test(arg)) {
      values.push(toNumericValue(getCellComputedValue(arg, cells, visiting)));
      return;
    }

    values.push(calculateMathExpression(arg));
  });

  switch (functionName.toUpperCase()) {
    case 'SUM':
      return formatFormulaResult(values.reduce((sum, value) => sum + value, 0));
    case 'AVERAGE':
      return formatFormulaResult(
        values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length,
      );
    case 'MAX':
      return formatFormulaResult(values.length === 0 ? 0 : Math.max(...values));
    case 'MIN':
      return formatFormulaResult(values.length === 0 ? 0 : Math.min(...values));
    case 'COUNT':
      return String(values.length);
    default:
      return '#ERROR!';
  }
}

export function evaluateFormula(
  formula: string,
  cells: Record<CellId, CellData>,
  visiting = new Set<CellId>(),
): string {
  if (!formula.trim().startsWith('=')) {
    return formula;
  }

  try {
    let expression = formula.trim().slice(1).toUpperCase();

    expression = expression.replace(FUNCTION_PATTERN, (_, functionName: string, args: string) => {
      return calculateFunction(functionName, args, cells, visiting);
    });

    expression = expression.replace(CELL_REFERENCE_PATTERN, (cellId: string) => {
      return String(toNumericValue(getCellComputedValue(cellId, cells, visiting)));
    });

    return formatFormulaResult(calculateMathExpression(expression));
  } catch {
    return '#ERROR!';
  }
}

export function createCell(id: CellId, value: string, cells: Record<CellId, CellData>): CellData {
  const type = detectCellType(value);

  return {
    id,
    value,
    type,
    computedValue: type === 'formula' ? evaluateFormula(value, cells, new Set([id])) : value,
  };
}

export function recalculateCells(cells: Record<CellId, CellData>): Record<CellId, CellData> {
  const result: Record<CellId, CellData> = {};

  Object.entries(cells).forEach(([id, cell]) => {
    const type = detectCellType(cell.value);

    result[id] = {
      ...cell,
      id,
      type,
      computedValue: type === 'formula' ? evaluateFormula(cell.value, cells, new Set([id])) : cell.value,
    };
  });

  return result;
}

export function shiftCellsAfterRowInsert(
  cells: Record<CellId, CellData>,
  index: number,
): Record<CellId, CellData> {
  const result: Record<CellId, CellData> = {};

  Object.values(cells).forEach((cell) => {
    const position = parseCellId(cell.id);
    const nextId = position.row >= index ? toCellId(position.row + 1, position.col) : cell.id;
    result[nextId] = { ...cell, id: nextId };
  });

  return recalculateCells(result);
}

export function shiftCellsAfterRowDelete(
  cells: Record<CellId, CellData>,
  index: number,
): Record<CellId, CellData> {
  const result: Record<CellId, CellData> = {};

  Object.values(cells).forEach((cell) => {
    const position = parseCellId(cell.id);

    if (position.row === index) {
      return;
    }

    const nextId = position.row > index ? toCellId(position.row - 1, position.col) : cell.id;
    result[nextId] = { ...cell, id: nextId };
  });

  return recalculateCells(result);
}

export function shiftCellsAfterColInsert(
  cells: Record<CellId, CellData>,
  index: number,
): Record<CellId, CellData> {
  const result: Record<CellId, CellData> = {};

  Object.values(cells).forEach((cell) => {
    const position = parseCellId(cell.id);
    const nextId = position.col >= index ? toCellId(position.row, position.col + 1) : cell.id;
    result[nextId] = { ...cell, id: nextId };
  });

  return recalculateCells(result);
}

export function shiftCellsAfterColDelete(
  cells: Record<CellId, CellData>,
  index: number,
): Record<CellId, CellData> {
  const result: Record<CellId, CellData> = {};

  Object.values(cells).forEach((cell) => {
    const position = parseCellId(cell.id);

    if (position.col === index) {
      return;
    }

    const nextId = position.col > index ? toCellId(position.row, position.col - 1) : cell.id;
    result[nextId] = { ...cell, id: nextId };
  });

  return recalculateCells(result);
}
