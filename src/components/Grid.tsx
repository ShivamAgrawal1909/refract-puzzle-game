import { useMemo } from 'react';
import type { Grid as GridType, MirrorPlacement, SimulationResult } from '../engine/types';

interface GridProps {
  grid: GridType;
  simulation: SimulationResult;
  solved: boolean;
  hintCell: MirrorPlacement | null;
  onCellClick: (x: number, y: number) => void;
}

const ROTATE: Record<string, number> = { N: 0, E: 90, S: 180, W: 270 };

export default function Grid({ grid, simulation, solved, hintCell, onCellClick }: GridProps) {
  const size = grid.length;

  const cell = useMemo(() => {
    const budget = 460;
    const raw = Math.floor(budget / size);
    return Math.max(34, Math.min(68, raw));
  }, [size]);

  const dim = size * cell;
  const litTargets = simulation.litTargets;

  return (
    <svg
      className="grid-svg"
      width={dim}
      height={dim}
      viewBox={`0 0 ${dim} ${dim}`}
      role="group"
      aria-label="Puzzle grid"
    >
      <defs>
        <filter id="beam-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="soft-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>

      {/* grid lines */}
      <g className="grid-lines">
        {Array.from({ length: size + 1 }).map((_, i) => (
          <line key={`v${i}`} x1={i * cell} y1={0} x2={i * cell} y2={dim} />
        ))}
        {Array.from({ length: size + 1 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * cell} x2={dim} y2={i * cell} />
        ))}
      </g>

      {/* cells */}
      {grid.map((row, y) =>
        row.map((c, x) => {
          const cx = x * cell + cell / 2;
          const cy = y * cell + cell / 2;
          const isHint = hintCell && hintCell.x === x && hintCell.y === y;

          if (c.type === 'wall') {
            return (
              <rect
                key={`${x}-${y}`}
                className="cell-wall"
                x={x * cell + 2}
                y={y * cell + 2}
                width={cell - 4}
                height={cell - 4}
              />
            );
          }

          if (c.type === 'emitter') {
            const rot = c.dir ? ROTATE[c.dir] : 0;
            return (
              <g key={`${x}-${y}`} className="cell-emitter-group">
                <circle cx={cx} cy={cy} r={cell * 0.4} className="cell-emitter-glow" filter="url(#soft-glow)" />
                <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
                  <polygon
                    className="cell-emitter"
                    points={`0,${-cell * 0.28} ${cell * 0.24},${cell * 0.2} ${-cell * 0.24},${cell * 0.2}`}
                  />
                </g>
              </g>
            );
          }

          if (c.type === 'target') {
            const lit = litTargets.has(`${x},${y}`);
            const r = cell * 0.3;
            return (
              <g key={`${x}-${y}`}>
                {lit && (
                  <circle cx={cx} cy={cy} r={r * 1.6} className="cell-target-glow" filter="url(#soft-glow)" />
                )}
                <polygon
                  className={`cell-target${lit ? ' lit' : ''}`}
                  points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
                />
              </g>
            );
          }

          if (c.type === 'splitter') {
            const r = cell * 0.26;
            return (
              <polygon
                key={`${x}-${y}`}
                className="cell-splitter"
                points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
              />
            );
          }

          // empty or mirror — clickable
          const clickable = c.type === 'empty' || c.type === 'mirror';
          return (
            <g key={`${x}-${y}`}>
              <rect
                x={x * cell}
                y={y * cell}
                width={cell}
                height={cell}
                className={`cell-clickable${clickable ? '' : ' disabled'}${isHint ? ' hint' : ''}`}
                onClick={clickable ? () => onCellClick(x, y) : undefined}
              />
              {c.type === 'mirror' && c.orientation === '/' && (
                <line
                  x1={cx - cell * 0.3}
                  y1={cy + cell * 0.3}
                  x2={cx + cell * 0.3}
                  y2={cy - cell * 0.3}
                  className="mirror-line"
                />
              )}
              {c.type === 'mirror' && c.orientation === '\\' && (
                <line
                  x1={cx - cell * 0.3}
                  y1={cy - cell * 0.3}
                  x2={cx + cell * 0.3}
                  y2={cy + cell * 0.3}
                  className="mirror-line"
                />
              )}
              {isHint && <circle cx={cx} cy={cy} r={cell * 0.36} className="hint-ring" />}
            </g>
          );
        }),
      )}

      {/* beams drawn last so they sit above terrain */}
      <g filter="url(#beam-glow)">
        {simulation.segments.map((seg, i) => {
          const d = seg.points
            .map(([px, py], idx) => `${idx === 0 ? 'M' : 'L'} ${px * cell + cell / 2} ${py * cell + cell / 2}`)
            .join(' ');
          return (
            <path
              key={i}
              d={d}
              className={`beam-path${solved ? ' solved' : ''}`}
              style={solved ? { animationDelay: `${(i % 5) * 0.12}s` } : undefined}
            />
          );
        })}
      </g>
    </svg>
  );
}
