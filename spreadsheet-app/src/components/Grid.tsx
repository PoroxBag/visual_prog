import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { shallowEqual } from 'react-redux';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { store, type RootState } from '@/app/store';
import { saveActiveDocument } from '@/features/documents/documentsSlice';
import {
  clearSelection,
  deleteCol,
  deleteRow,
  insertCol,
  insertRow,
  moveSelection,
  pasteClipboard,
  redo,
  resizeCol,
  resizeRow,
  selectCell,
  selectRange,
  setClipboard,
  setClipboardFromText,
  startEditing,
  stopEditing,
  undo,
  updateCell,
} from '@/features/spreadsheet/spreadsheetSlice';
import type { CellData, CellId, ClipboardData } from '@/types';
import { ROW_HEADER_WIDTH, columnIndexToName, isCellInRange, parseCellId, toCellId } from '@/utils/formulas';
import { clipboardToText, createClipboardFromSelection, getSelectionBounds } from '@/utils/spreadsheet';

interface ContextMenuState {
  x: number;
  y: number;
  visible: boolean;
  targetId: CellId | null;
}

interface CellViewState {
  data: CellData | undefined;
  isSelected: boolean;
  isInRange: boolean;
  isEditing: boolean;
}

interface CellProps {
  id: CellId;
  width: number;
  height: number;
  onSelect: (id: CellId, shiftKey: boolean) => void;
  onStartEditing: (id: CellId) => void;
  onStopEditing: () => void;
  onUpdate: (id: CellId, value: string) => void;
  onContextMenu: (event: ReactMouseEvent, id: CellId) => void;
}

interface CellEditorProps {
  id: CellId;
  initialValue: string;
  onStopEditing: () => void;
  onUpdate: (id: CellId, value: string) => void;
}

function CellEditor({ id, initialValue, onStopEditing, onUpdate }: CellEditorProps) {
  const [draft, setDraft] = useState(initialValue);

  const commit = useCallback(() => {
    onUpdate(id, draft);
    onStopEditing();
  }, [draft, id, onStopEditing, onUpdate]);

  return (
    <input
      className="grid-cell__editor"
      autoFocus
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          onStopEditing();
        }
      }}
    />
  );
}

const Cell = memo(function Cell({
  id,
  width,
  height,
  onSelect,
  onStartEditing,
  onStopEditing,
  onUpdate,
  onContextMenu,
}: CellProps) {
  const view = useAppSelector((state: RootState): CellViewState => {
    const range = state.spreadsheet.selectionRange;

    return {
      data: state.spreadsheet.cells[id],
      isSelected: state.spreadsheet.selectedCell === id,
      isInRange: range ? isCellInRange(id, range.start, range.end) : false,
      isEditing: state.spreadsheet.editingCell === id,
    };
  }, shallowEqual);
  const rawValue = view.data?.value ?? '';

  return (
    <button
      type="button"
      className={[
        'grid-cell',
        view.isSelected ? 'grid-cell--selected' : '',
        view.isInRange ? 'grid-cell--range' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ width, height }}
      onClick={(event) => onSelect(id, event.shiftKey)}
      onDoubleClick={() => onStartEditing(id)}
      onContextMenu={(event) => onContextMenu(event, id)}
      title={`${id}: ${rawValue}`}
      aria-label={`Ячейка ${id}`}
    >
      {view.isEditing ? (
        <CellEditor
          key={`${id}:${rawValue}`}
          id={id}
          initialValue={rawValue}
          onStopEditing={onStopEditing}
          onUpdate={onUpdate}
        />
      ) : (
        <span className="grid-cell__value">{view.data?.computedValue ?? ''}</span>
      )}
    </button>
  );
});

function isTargetInsideRange(id: CellId, start: CellId, end: CellId): boolean {
  return isCellInRange(id, start, end);
}

export function Grid() {
  const dispatch = useAppDispatch();
  const rowCount = useAppSelector((state) => state.spreadsheet.rowCount);
  const colCount = useAppSelector((state) => state.spreadsheet.colCount);
  const colWidths = useAppSelector((state) => state.spreadsheet.colWidths);
  const rowHeights = useAppSelector((state) => state.spreadsheet.rowHeights);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [menu, setMenu] = useState<ContextMenuState>({ x: 0, y: 0, visible: false, targetId: null });

  const getColWidth = useCallback((index: number) => colWidths[index] ?? 100, [colWidths]);
  const getRowHeight = useCallback((index: number) => rowHeights[index] ?? 28, [rowHeights]);

  const columns = useMemo(
    () =>
      Array.from({ length: colCount }, (_, index) => {
        const colIndex = index + 1;
        return {
          index: colIndex,
          name: columnIndexToName(colIndex),
          width: getColWidth(colIndex),
        };
      }),
    [colCount, getColWidth],
  );

  const gridWidth = useMemo(
    () => columns.reduce((total, column) => total + column.width, ROW_HEADER_WIDTH),
    [columns],
  );

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => getRowHeight(index + 1),
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const selectGridCell = useCallback(
    (id: CellId, shiftKey: boolean) => {
      const current = store.getState().spreadsheet;

      if (shiftKey && current.selectedCell) {
        dispatch(selectRange({ start: current.selectedCell, end: id }));
        return;
      }

      dispatch(selectCell({ id }));
    },
    [dispatch],
  );

  const closeMenu = useCallback(() => {
    setMenu((current) => ({ ...current, visible: false }));
  }, []);

  const buildClipboard = useCallback((): ClipboardData | null => {
    const current = store.getState().spreadsheet;
    const bounds = getSelectionBounds(current.selectedCell, current.selectionRange);

    if (!bounds) {
      return null;
    }

    return createClipboardFromSelection(current.cells, bounds);
  }, []);

  const copySelectedCells = useCallback(async () => {
    const clipboard = buildClipboard();

    if (!clipboard) {
      return;
    }

    dispatch(setClipboard(clipboard));

    if ('clipboard' in navigator) {
      try {
        await navigator.clipboard.writeText(clipboardToText(clipboard));
      } catch {
        return;
      }
    }
  }, [buildClipboard, dispatch]);

  const pasteToCell = useCallback(
    async (targetId?: CellId | null) => {
      let hasClipboardText = false;

      if ('clipboard' in navigator) {
        try {
          const text = await navigator.clipboard.readText();

          if (text.length > 0) {
            dispatch(setClipboardFromText(text));
            hasClipboardText = true;
          }
        } catch {
          hasClipboardText = false;
        }
      }

      if (hasClipboardText || store.getState().spreadsheet.clipboard) {
        dispatch(pasteClipboard({ targetId: targetId ?? undefined }));
      }
    },
    [dispatch],
  );

  const clearCurrentSelection = useCallback(() => {
    dispatch(clearSelection());
  }, [dispatch]);

  const startEditingCell = useCallback(
    (id: CellId) => {
      dispatch(startEditing({ id }));
    },
    [dispatch],
  );

  const stopEditingCell = useCallback(() => {
    dispatch(stopEditing());
  }, [dispatch]);

  const updateGridCell = useCallback(
    (id: CellId, value: string) => {
      dispatch(updateCell({ id, value }));
    },
    [dispatch],
  );

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const current = store.getState().spreadsheet;
      const activeTagName = document.activeElement?.tagName;
      const isEditingInput = activeTagName === 'INPUT' || activeTagName === 'TEXTAREA';

      if (isEditingInput && current.editingCell !== null) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void dispatch(saveActiveDocument());
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault();
        dispatch(redo());
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        dispatch(undo());
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        dispatch(redo());
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        void copySelectedCells();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        void pasteToCell(current.selectedCell);
        return;
      }

      if (event.key === 'Enter' && current.selectedCell) {
        event.preventDefault();
        dispatch(startEditing({ id: current.selectedCell }));
        return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && current.selectedCell) {
        event.preventDefault();
        clearCurrentSelection();
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        dispatch(moveSelection({ rowDelta: -1, colDelta: 0 }));
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        dispatch(moveSelection({ rowDelta: 1, colDelta: 0 }));
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        dispatch(moveSelection({ rowDelta: 0, colDelta: -1 }));
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'Tab') {
        event.preventDefault();
        dispatch(moveSelection({ rowDelta: 0, colDelta: 1 }));
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [clearCurrentSelection, copySelectedCells, dispatch, pasteToCell]);

  const handleColumnResize = useCallback(
    (index: number, event: ReactMouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startWidth = getColWidth(index);

      const handleMove = (moveEvent: MouseEvent) => {
        dispatch(resizeCol({ index, width: startWidth + moveEvent.clientX - startX }));
      };

      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [dispatch, getColWidth],
  );

  const handleRowResize = useCallback(
    (index: number, event: ReactMouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const startY = event.clientY;
      const startHeight = getRowHeight(index);

      const handleMove = (moveEvent: MouseEvent) => {
        dispatch(resizeRow({ index, height: startHeight + moveEvent.clientY - startY }));
        rowVirtualizer.measure();
      };

      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [dispatch, getRowHeight, rowVirtualizer],
  );

  const handleContextMenu = useCallback(
    (event: ReactMouseEvent, id: CellId) => {
      event.preventDefault();
      const current = store.getState().spreadsheet;

      if (
        !current.selectionRange ||
        !isTargetInsideRange(id, current.selectionRange.start, current.selectionRange.end)
      ) {
        dispatch(selectCell({ id }));
      }

      setMenu({ x: event.clientX, y: event.clientY, visible: true, targetId: id });
    },
    [dispatch],
  );

  useEffect(() => {
    const close = () => closeMenu();
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [closeMenu]);

  const menuTargetId = menu.visible ? menu.targetId : null;

  return (
    <section className="spreadsheet" aria-label="Таблица">
      <div className="spreadsheet__hint">
        Enter — редактировать, Ctrl+S — сохранить, Ctrl+Z — отменить, Ctrl+Y — повторить, Shift+клик —
        диапазон, Ctrl+C/Ctrl+V — копировать и вставить диапазон.
      </div>
      <div ref={parentRef} className="spreadsheet__viewport">
        <div
          className="spreadsheet__sheet"
          style={{ width: gridWidth, height: rowVirtualizer.getTotalSize() + 32 }}
        >
          <div className="spreadsheet__header" style={{ width: gridWidth }}>
            <div className="spreadsheet__corner" style={{ width: ROW_HEADER_WIDTH }} />
            {columns.map((column) => (
              <div key={column.index} className="spreadsheet__column-header" style={{ width: column.width }}>
                {column.name}
                <span
                  role="separator"
                  aria-orientation="vertical"
                  className="spreadsheet__col-resizer"
                  onMouseDown={(event) => handleColumnResize(column.index, event)}
                />
              </div>
            ))}
          </div>
          <div className="spreadsheet__body" style={{ height: rowVirtualizer.getTotalSize() }}>
            {virtualRows.map((virtualRow) => {
              const rowIndex = virtualRow.index + 1;
              const rowHeight = getRowHeight(rowIndex);

              return (
                <div
                  key={virtualRow.key}
                  className="spreadsheet__row"
                  style={{
                    width: gridWidth,
                    height: rowHeight,
                    transform: `translate3d(0, ${virtualRow.start + 32}px, 0)`,
                  }}
                >
                  <div
                    className="spreadsheet__row-header"
                    style={{ width: ROW_HEADER_WIDTH, height: rowHeight }}
                  >
                    {rowIndex}
                    <span
                      role="separator"
                      aria-orientation="horizontal"
                      className="spreadsheet__row-resizer"
                      onMouseDown={(event) => handleRowResize(rowIndex, event)}
                    />
                  </div>
                  {columns.map((column) => {
                    const id = toCellId(rowIndex, column.index);

                    return (
                      <Cell
                        key={id}
                        id={id}
                        width={column.width}
                        height={rowHeight}
                        onSelect={selectGridCell}
                        onStartEditing={startEditingCell}
                        onStopEditing={stopEditingCell}
                        onUpdate={updateGridCell}
                        onContextMenu={handleContextMenu}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {menuTargetId ? (
        <div
          className="context-menu"
          style={{ top: menu.y, left: menu.x }}
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" onClick={() => void copySelectedCells().then(closeMenu)}>
            Копировать
          </button>
          <button type="button" onClick={() => void pasteToCell(menuTargetId).then(closeMenu)}>
            Вставить
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch(insertRow({ index: parseCellId(menuTargetId).row }));
              closeMenu();
            }}
          >
            Вставить строку выше
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch(insertRow({ index: parseCellId(menuTargetId).row + 1 }));
              closeMenu();
            }}
          >
            Вставить строку ниже
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch(deleteRow({ index: parseCellId(menuTargetId).row }));
              closeMenu();
            }}
          >
            Удалить строку
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch(insertCol({ index: parseCellId(menuTargetId).col }));
              closeMenu();
            }}
          >
            Вставить столбец слева
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch(insertCol({ index: parseCellId(menuTargetId).col + 1 }));
              closeMenu();
            }}
          >
            Вставить столбец справа
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch(deleteCol({ index: parseCellId(menuTargetId).col }));
              closeMenu();
            }}
          >
            Удалить столбец
          </button>
          <button
            type="button"
            onClick={() => {
              clearCurrentSelection();
              closeMenu();
            }}
          >
            Очистить
          </button>
        </div>
      ) : null}
    </section>
  );
}
