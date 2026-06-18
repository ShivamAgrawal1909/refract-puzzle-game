import type { Grid, MirrorPlacement, Orientation } from './types';
import { isSolved, simulateBeams } from './beam';

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((c) => ({ ...c })));
}

/**
 * Finds a mirror placement (within `budget` moves) that solves the puzzle,
 * if one exists. Candidate cells are restricted to empty cells the current
 * beams actually pass through — a mirror anywhere else can't change the
 * outcome, so this keeps the search small even on 9x9 grids.
 */
export function solve(grid: Grid, budget: number): MirrorPlacement[] | null {
  if (isSolved(grid)) return [];
  if (budget <= 0) return null;

  const { segments } = simulateBeams(grid);
  const seen = new Set<string>();
  const candidates: { x: number; y: number }[] = [];
  for (const seg of segments) {
    for (const [x, y] of seg.points) {
      const k = `${x},${y}`;
      if (seen.has(k)) continue;
      if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) continue;
      if (grid[y][x].type === 'empty') {
        seen.add(k);
        candidates.push({ x, y });
      }
    }
  }
  if (candidates.length === 0) return null;

  const orientations: Orientation[] = ['/', '\\'];
  for (const cell of candidates) {
    for (const orientation of orientations) {
      const next = cloneGrid(grid);
      next[cell.y][cell.x] = { type: 'mirror', orientation };
      const rest = solve(next, budget - 1);
      if (rest !== null) return [{ x: cell.x, y: cell.y, orientation }, ...rest];
    }
  }
  return null;
}
