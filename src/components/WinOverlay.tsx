import type { MouseEvent } from 'react';

interface WinOverlayProps {
  levelIndex: number;
  totalLevels: number;
  mirrorsUsed: number;
  mirrorBudget: number;
  hintsUsed: number;
  stars: number;
  isLastLevel: boolean;
  onNext: () => void;
  onReplay: () => void;
  onClose: () => void;
}

export default function WinOverlay({
  levelIndex,
  totalLevels,
  mirrorsUsed,
  mirrorBudget,
  hintsUsed,
  stars,
  isLastLevel,
  onNext,
  onReplay,
  onClose,
}: WinOverlayProps) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <h2>Crystals ignited</h2>
        <p>
          Level {levelIndex} of {totalLevels} complete.
        </p>

        <div className="win-stars">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`win-star${i < stars ? ' lit' : ''}`}>
              ✦
            </span>
          ))}
        </div>

        <div>
          <div className="win-stat-row">
            <span>Mirrors used</span>
            <span>
              {mirrorsUsed} / {mirrorBudget}
            </span>
          </div>
          <div className="win-stat-row">
            <span>Hints used</span>
            <span>{hintsUsed}</span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onReplay}>
            Replay
          </button>
          {!isLastLevel && (
            <button className="btn-primary" onClick={onNext}>
              Next level
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
