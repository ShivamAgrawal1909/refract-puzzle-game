import type { MouseEvent } from 'react';

interface HowToPlayProps {
  onClose: () => void;
}

export default function HowToPlay({ onClose }: HowToPlayProps) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <h2>How to play</h2>
        <div className="howto-rules">
          <div className="howto-rule">
            <strong>Emitter</strong>
            <span>The amber triangle fires a beam of light in a fixed direction.</span>
          </div>
          <div className="howto-rule">
            <strong>Mirrors</strong>
            <span>
              Click an empty cell to place a mirror, click again to flip its angle, and click once more to
              remove it. Mirrors redirect the beam 90°.
            </span>
          </div>
          <div className="howto-rule">
            <strong>Splitters</strong>
            <span>The violet diamond divides a beam into two perpendicular beams.</span>
          </div>
          <div className="howto-rule">
            <strong>Targets</strong>
            <span>Crystals ignite — and the level is solved — once every target is struck by a beam.</span>
          </div>
          <div className="howto-rule">
            <strong>Budget</strong>
            <span>Each level limits how many mirrors you can place. Plan your route carefully.</span>
          </div>
          <div className="howto-rule">
            <strong>Stuck?</strong>
            <span>Use a hint to reveal one correct mirror placement — but it costs a star.</span>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
