import { useMemo, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import type { CellData, CellId } from '@/types';
import { toCellId } from '@/utils/formulas';
import { getSelectionBounds } from '@/utils/spreadsheet';

type ChartType = 'bar' | 'line';

interface ChartPoint {
  id: CellId;
  value: number;
}

function parseChartNumber(cell: CellData | undefined): number | null {
  const source = cell?.computedValue ?? cell?.value ?? '';
  const normalized = source
    .replace('%', '')
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function createPath(points: ChartPoint[], width: number, height: number, padding: number): string {
  if (points.length === 0) {
    return '';
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const step = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  return points
    .map((point, index) => {
      const x = points.length > 1 ? padding + index * step : width / 2;
      const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export function ChartPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const cells = useAppSelector((state) => state.spreadsheet.cells);
  const selectedCell = useAppSelector((state) => state.spreadsheet.selectedCell);
  const selectionRange = useAppSelector((state) => state.spreadsheet.selectionRange);

  const points = useMemo(() => {
    const bounds = getSelectionBounds(selectedCell, selectionRange);

    if (!bounds) {
      return [];
    }

    const nextPoints: ChartPoint[] = [];

    for (let row = bounds.startRow; row <= bounds.endRow; row += 1) {
      for (let col = bounds.startCol; col <= bounds.endCol; col += 1) {
        const id = toCellId(row, col);
        const value = parseChartNumber(cells[id]);

        if (value !== null) {
          nextPoints.push({ id, value });
        }
      }
    }

    return nextPoints;
  }, [cells, selectedCell, selectionRange]);

  const values = points.map((point) => point.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 1);
  const range = maxValue - minValue || 1;
  const width = 720;
  const height = 280;
  const padding = 36;
  const barGap = 8;
  const barWidth = points.length > 0 ? Math.max(10, (width - padding * 2) / points.length - barGap) : 0;
  const linePath = createPath(points, width, height, padding);

  return (
    <section className="chart-panel" aria-label="График по выделенному диапазону">
      <div className="chart-panel__controls">
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setIsOpen(true)}
          disabled={points.length === 0}
        >
          Построить график
        </button>
        <select value={chartType} onChange={(event) => setChartType(event.target.value as ChartType)}>
          <option value="bar">Столбцы</option>
          <option value="line">Линия</option>
        </select>
        <span>{points.length > 0 ? `Числовых ячеек: ${points.length}` : 'Выдели диапазон с числами'}</span>
      </div>

      {isOpen ? (
        <div className="chart-panel__modal" role="dialog" aria-modal="true" aria-label="График">
          <div className="chart-panel__content">
            <header className="chart-panel__header">
              <div>
                <h3>График по выделенному диапазону</h3>
                <p>{points.map((point) => point.id).join(', ')}</p>
              </div>
              <button type="button" className="button button--ghost" onClick={() => setIsOpen(false)}>
                Закрыть
              </button>
            </header>

            {points.length === 0 ? (
              <div className="empty-state">В выделенном диапазоне нет числовых значений.</div>
            ) : (
              <svg className="chart-panel__svg" viewBox={`0 0 ${width} ${height}`} role="img">
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
                {chartType === 'bar'
                  ? points.map((point, index) => {
                      const x = padding + index * (barWidth + barGap) + barGap / 2;
                      const barHeight = ((point.value - minValue) / range) * (height - padding * 2);
                      const y = height - padding - barHeight;

                      return (
                        <g key={point.id}>
                          <rect x={x} y={y} width={barWidth} height={Math.max(2, barHeight)} rx="6" />
                          <text x={x + barWidth / 2} y={height - 12} textAnchor="middle">
                            {point.id}
                          </text>
                        </g>
                      );
                    })
                  : null}
                {chartType === 'line' ? <path d={linePath} /> : null}
                {chartType === 'line'
                  ? points.map((point, index) => {
                      const step = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
                      const x = points.length > 1 ? padding + index * step : width / 2;
                      const y =
                        height - padding - ((point.value - minValue) / range) * (height - padding * 2);

                      return (
                        <g key={point.id}>
                          <circle cx={x} cy={y} r="5" />
                          <text x={x} y={height - 12} textAnchor="middle">
                            {point.id}
                          </text>
                        </g>
                      );
                    })
                  : null}
              </svg>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
