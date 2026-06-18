import type { MouseEvent } from 'react';

interface LevelProgress {
  stars: number;
  hintsUsed: number;
}

interface LevelSelectProps {
  totalLevels: number;
  currentLevel: number;
  highestUnlocked: number;
  completed: Record<number, LevelProgress>;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export default function LevelSelect({
  totalLevels,
  currentLevel,
  highestUnlocked,
  completed,
  onSelect,
  onClose,
}: LevelSelectProps) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <h2>Select level</h2>
        <div className="level-grid">
          {Array.from({ length: totalLevels }, (_, i) => i + 1).map((n) => {
            const unlocked = n <= highestUnlocked;
            const stars = completed[n]?.stars ?? 0;
            return (
              <button
                key={n}
                className={`level-tile${n === currentLevel ? ' current' : ''}`}
                disabled={!unlocked}
                onClick={() => {
                  if (unlocked) {
                    onSelect(n);
                    onClose();
                  }
                }}
              >
                <span>{n}</span>
                <span className="level-tile-stars">
                  {[0, 1, 2].map((s) => (
                    <span key={s} className={`star${s < stars ? ' lit' : ''}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
