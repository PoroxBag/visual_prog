import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { closeDoomMode } from '@/features/ui/uiSlice';

type DoomTile = 'floor' | 'wall' | 'enemy' | 'exit';

interface Position {
  row: number;
  col: number;
}

const baseMap: DoomTile[][] = [
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'enemy', 'floor', 'floor', 'floor', 'wall', 'floor', 'exit', 'wall'],
  ['wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'wall', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'wall', 'enemy', 'wall', 'wall', 'wall', 'floor', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'floor', 'wall', 'floor', 'floor', 'floor', 'wall', 'wall', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
  ['wall', 'floor', 'enemy', 'wall', 'wall', 'floor', 'wall', 'wall', 'floor', 'wall', 'floor', 'wall'],
  ['wall', 'floor', 'floor', 'floor', 'wall', 'floor', 'floor', 'floor', 'floor', 'wall', 'floor', 'wall'],
  ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
];

const initialPlayer: Position = { row: 1, col: 1 };

function positionKey(position: Position): string {
  return `${position.row}:${position.col}`;
}

export function DoomMode() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isDoomModeOpen);
  const [player, setPlayer] = useState<Position>(initialPlayer);
  const [health, setHealth] = useState(3);
  const [status, setStatus] = useState('Доберись до выхода и не врежься во врагов.');

  const resetGame = useCallback(() => {
    setPlayer(initialPlayer);
    setHealth(3);
    setStatus('Доберись до выхода и не врежься во врагов.');
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetGame();
    }
  }, [isOpen, resetGame]);

  const move = useCallback((rowDelta: number, colDelta: number) => {
    setPlayer((current) => {
      const next = { row: current.row + rowDelta, col: current.col + colDelta };
      const tile = baseMap[next.row]?.[next.col];

      if (!tile || tile === 'wall') {
        setStatus('Стена. Нужен другой путь.');
        return current;
      }

      if (tile === 'enemy') {
        setHealth((value) => Math.max(0, value - 1));
        setStatus('Попал во врага. Минус здоровье.');
        return initialPlayer;
      }

      if (tile === 'exit') {
        setStatus('Выход найден. Уровень пройден.');
        return next;
      }

      setStatus('Двигаемся.');
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dispatch(closeDoomMode());
        return;
      }

      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        event.preventDefault();
        move(-1, 0);
        return;
      }

      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        event.preventDefault();
        move(1, 0);
        return;
      }

      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        event.preventDefault();
        move(0, -1);
        return;
      }

      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        event.preventDefault();
        move(0, 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, isOpen, move]);

  const enemyCount = useMemo(() => baseMap.flat().filter((tile) => tile === 'enemy').length, []);

  if (!isOpen) {
    return null;
  }

  return (
    <section className="doom-mode" aria-label="Doom mode">
      <div className="doom-mode__panel">
        <header className="doom-mode__header">
          <div>
            <h3>Doom mode</h3>
          </div>
          <div className="doom-mode__actions">
            <button type="button" className="button button--ghost" onClick={resetGame}>
              Заново
            </button>
            <button type="button" className="button button--ghost" onClick={() => dispatch(closeDoomMode())}>
              Закрыть
            </button>
          </div>
        </header>

        <div className="doom-mode__stats">
          <span>Здоровье: {health}</span>
          <span>Враги: {enemyCount}</span>
          <span>{status}</span>
        </div>

        <div className="doom-mode__grid">
          {baseMap.map((row, rowIndex) =>
            row.map((tile, colIndex) => {
              const key = positionKey({ row: rowIndex, col: colIndex });
              const isPlayer = player.row === rowIndex && player.col === colIndex;

              return (
                <div key={key} className={`doom-mode__cell doom-mode__cell--${tile}`}>
                  {isPlayer ? 'P' : tile === 'enemy' ? 'E' : tile === 'exit' ? 'X' : ''}
                </div>
              );
            }),
          )}
        </div>

        <div className="doom-mode__controls">
          <button type="button" onClick={() => move(-1, 0)}>
            ↑
          </button>
          <button type="button" onClick={() => move(0, -1)}>
            ←
          </button>
          <button type="button" onClick={() => move(1, 0)}>
            ↓
          </button>
          <button type="button" onClick={() => move(0, 1)}>
            →
          </button>
        </div>
      </div>
    </section>
  );
}
