import { describe, expect, it } from 'vitest';
import { createCell, expandRange, evaluateFormula, recalculateCells } from './formulas';
import type { CellData } from '@/types';

describe('formula utilities', () => {
  it('expands ranges with spreadsheet addresses', () => {
    expect(expandRange('A1:B2')).toEqual(['A1', 'B1', 'A2', 'B2']);
  });

  it('calculates SUM and AVERAGE formulas', () => {
    const cells: Record<string, CellData> = {};
    cells.A1 = createCell('A1', '10', cells);
    cells.A2 = createCell('A2', '20', cells);
    cells.A3 = createCell('A3', '30', cells);
    const recalculated = recalculateCells(cells);

    expect(evaluateFormula('=SUM(A1:A3)', recalculated)).toBe('60');
    expect(evaluateFormula('=AVERAGE(A1:A3)', recalculated)).toBe('20');
  });

  it('calculates arithmetic formulas with cell references', () => {
    const cells: Record<string, CellData> = {};
    cells.A1 = createCell('A1', '5', cells);
    cells.B1 = createCell('B1', '7', cells);
    const recalculated = recalculateCells(cells);

    expect(evaluateFormula('=A1+B1', recalculated)).toBe('12');
    expect(evaluateFormula('=A1*2', recalculated)).toBe('10');
  });
});
