import type { Direction, Grid, Orientation, SimulationResult, BeamSegment } from './types';

export const DELTA: Record<Direction, [number, number]> = {
  N: [0, -1],
  E: [1, 0],
  S: [0, 1],
  W: [-1, 0],
};

export const MIRROR_MAP: Record<Orientation, Record<Direction, Direction>> = {
  '/': { N: 'E', E: 'N', S: 'W', W: 'S' },
  '\\': { N: 'W', W: 'N', S: 'E', E: 'S' },
};

function inBounds(grid: Grid, x: number, y: number): boolean {
  return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length;
}

interface BeamState {
  x: number;
  y: number;
  dir: Direction;
  path: [number, number][];
}

/**
 * Traces every beam from every emitter through the grid, handling mirror
 * reflection, splitter branching, wall/target absorption, and cycle
 * detection (so a closed loop of mirrors can't hang the simulation).
 */
export function simulateBeams(grid: Grid): SimulationResult {
  const litTargets = new Set<string>();
  const segments: BeamSegment[] = [];
  const visited = new Set<string>();

  const emitters: { x: number; y: number; dir: Direction }[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x];
      if (cell.type === 'emitter' && cell.dir) emitters.push({ x, y, dir: cell.dir });
    }
  }

  const queue: BeamState[] = emitters.map((e) => ({
    x: e.x,
    y: e.y,
    dir: e.dir,
    path: [[e.x, e.y]],
  }));

  let guard = 0;
  while (queue.length) {
    if (++guard > 5000) break; // safety valve against pathological grids
    const beam = queue.shift()!;
    let { x, y, dir } = beam;
    const path = beam.path;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const [dx, dy] = DELTA[dir];
      const nx = x + dx;
      const ny = y + dy;

      if (!inBounds(grid, nx, ny)) {
        path.push([nx, ny]);
        segments.push({ points: path });
        break;
      }

      const stateKey = `${nx},${ny},${dir}`;
      if (visited.has(stateKey)) {
        path.push([nx, ny]);
        segments.push({ points: path });
        break;
      }
      visited.add(stateKey);

      const cell = grid[ny][nx];
      path.push([nx, ny]);

      if (cell.type === 'wall' || cell.type === 'emitter') {
        segments.push({ points: path });
        break;
      }

      if (cell.type === 'target') {
        segments.push({ points: path });
        litTargets.add(`${nx},${ny}`);
        break;
      }

      if (cell.type === 'mirror' && cell.orientation) {
        const newDir = MIRROR_MAP[cell.orientation][dir];
        x = nx;
        y = ny;
        dir = newDir;
        continue;
      }

      if (cell.type === 'splitter') {
        segments.push({ points: path });
        const perp: Direction[] = dir === 'N' || dir === 'S' ? ['E', 'W'] : ['N', 'S'];
        for (const pd of perp) {
          queue.push({ x: nx, y: ny, dir: pd, path: [[nx, ny]] });
        }
        break;
      }

      // empty cell: beam passes straight through
      x = nx;
      y = ny;
    }
  }

  return { litTargets, segments };
}

export function countTargets(grid: Grid): number {
  let n = 0;
  for (const row of grid) for (const c of row) if (c.type === 'target') n++;
  return n;
}

export function isSolved(grid: Grid): boolean {
  const { litTargets } = simulateBeams(grid);
  return litTargets.size === countTargets(grid) && countTargets(grid) > 0;
}
