import type { Cell, Direction, Grid, LevelData, MirrorPlacement, Orientation, Point } from './types';
import { isSolved } from './beam';
import { mulberry32, type RNG } from './rng';

const DELTA: Record<Direction, [number, number]> = {
  N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0],
};
const MIRROR_MAP: Record<Orientation, Record<Direction, Direction>> = {
  '/': { N: 'E', E: 'N', S: 'W', W: 'S' },
  '\\': { N: 'W', W: 'N', S: 'E', E: 'S' },
};
const PERP: Record<Direction, [Direction, Direction]> = {
  N: ['E', 'W'], S: ['E', 'W'], E: ['N', 'S'], W: ['N', 'S'],
};

function key(p: Point): string {
  return `${p.x},${p.y}`;
}
function add(p: Point, d: Direction): Point {
  const [dx, dy] = DELTA[d];
  return { x: p.x + dx, y: p.y + dy };
}
function inBounds(size: number, p: Point): boolean {
  return p.x >= 0 && p.x < size && p.y >= 0 && p.y < size;
}
function orientationFor(fromDir: Direction, toDir: Direction): Orientation | null {
  if (MIRROR_MAP['/'][fromDir] === toDir) return '/';
  if (MIRROR_MAP['\\'][fromDir] === toDir) return '\\';
  return null;
}

interface DifficultyTier {
  size: number;
  pathMinLen: number;
  pathMaxLen: number;
  branchMinLen: number;
  branchMaxLen: number;
  turnProb: number;
  useSplitter: boolean;
}

const TIERS: DifficultyTier[] = [
  { size: 5, pathMinLen: 2, pathMaxLen: 3, branchMinLen: 0, branchMaxLen: 0, turnProb: 0.5, useSplitter: false },
  { size: 5, pathMinLen: 3, pathMaxLen: 4, branchMinLen: 0, branchMaxLen: 0, turnProb: 0.6, useSplitter: false },
  { size: 6, pathMinLen: 4, pathMaxLen: 5, branchMinLen: 0, branchMaxLen: 0, turnProb: 0.6, useSplitter: false },
  { size: 6, pathMinLen: 4, pathMaxLen: 6, branchMinLen: 0, branchMaxLen: 0, turnProb: 0.65, useSplitter: false },
  { size: 7, pathMinLen: 3, pathMaxLen: 4, branchMinLen: 2, branchMaxLen: 3, turnProb: 0.6, useSplitter: true },
  { size: 7, pathMinLen: 3, pathMaxLen: 4, branchMinLen: 3, branchMaxLen: 4, turnProb: 0.65, useSplitter: true },
  { size: 8, pathMinLen: 4, pathMaxLen: 5, branchMinLen: 3, branchMaxLen: 4, turnProb: 0.65, useSplitter: true },
  { size: 8, pathMinLen: 4, pathMaxLen: 5, branchMinLen: 4, branchMaxLen: 5, turnProb: 0.7, useSplitter: true },
  { size: 9, pathMinLen: 4, pathMaxLen: 6, branchMinLen: 4, branchMaxLen: 5, turnProb: 0.7, useSplitter: true },
  { size: 9, pathMinLen: 5, pathMaxLen: 6, branchMinLen: 4, branchMaxLen: 6, turnProb: 0.75, useSplitter: true },
];

export const TOTAL_LEVELS = TIERS.length;

function difficultyFor(levelIndex: number): DifficultyTier {
  return TIERS[Math.min(levelIndex - 1, TIERS.length - 1)];
}

function pickEmitterEdge(size: number, rng: RNG): { x: number; y: number; dir: Direction } {
  const edge = Math.floor(rng() * 4);
  const inset = () => 1 + Math.floor(rng() * (size - 2));
  if (edge === 0) return { x: 0, y: inset(), dir: 'E' };
  if (edge === 1) return { x: size - 1, y: inset(), dir: 'W' };
  if (edge === 2) return { x: inset(), y: 0, dir: 'S' };
  return { x: inset(), y: size - 1, dir: 'N' };
}

interface WalkResult {
  cells: Point[];
  mirrors: MirrorPlacement[];
  endPos: Point;
}

function walkPath(
  size: number,
  start: Point,
  dir: Direction,
  minLen: number,
  maxLen: number,
  turnProb: number,
  visited: Set<string>,
  rng: RNG,
): WalkResult | null {
  let pos = start;
  let curDir = dir;
  const mirrors: MirrorPlacement[] = [];
  const cells: Point[] = [];
  const length = minLen + Math.floor(rng() * (maxLen - minLen + 1));

  for (let step = 0; step < length; step++) {
    const next = add(pos, curDir);
    if (!inBounds(size, next) || visited.has(key(next))) {
      if (cells.length === 0) return null;
      break;
    }
    visited.add(key(next));
    cells.push(next);

    const canTurn = step > 0 && step < length - 1;
    if (canTurn && rng() < turnProb) {
      const options = PERP[curDir];
      const toDir = options[Math.floor(rng() * options.length)];
      const orientation = orientationFor(curDir, toDir);
      if (orientation) {
        mirrors.push({ x: next.x, y: next.y, orientation });
        curDir = toDir;
      }
    }
    pos = next;
  }

  if (cells.length === 0) return null;
  return { cells, mirrors, endPos: pos };
}

function emptyGrid(size: number): Grid {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, (): Cell => ({ type: 'empty' })),
  );
}

export function generateLevelWithSeed(levelIndex: number, seed: number): LevelData {
  const rng = mulberry32(seed);
  const tier = difficultyFor(levelIndex);
  const size = tier.size;

  for (let attempt = 0; attempt < 60; attempt++) {
    const grid = emptyGrid(size);
    const visited = new Set<string>();
    const emitter = pickEmitterEdge(size, rng);
    visited.add(key(emitter));
    grid[emitter.y][emitter.x] = { type: 'emitter', dir: emitter.dir };

    const path1 = walkPath(size, emitter, emitter.dir, tier.pathMinLen, tier.pathMaxLen, tier.turnProb, visited, rng);
    if (!path1) continue;

    let allMirrors: MirrorPlacement[] = [...path1.mirrors];
    let targets: Point[] | null = [];
    let splitterPos: Point | null = null;

    if (tier.useSplitter && path1.cells.length >= 3) {
      const mirrorKeys = new Set(path1.mirrors.map(key));
      const midCandidates = path1.cells.slice(1, -1).filter((c) => !mirrorKeys.has(key(c)));
      if (midCandidates.length === 0) continue;
      const splitCell = midCandidates[Math.floor(rng() * midCandidates.length)];
      splitterPos = splitCell;

      const idx = path1.cells.findIndex((c) => key(c) === key(splitCell));
      const prevCell = idx === 0 ? emitter : path1.cells[idx - 1];
      const arrivalDir = (Object.keys(DELTA) as Direction[]).find(
        (d) => key(add(prevCell, d)) === key(splitCell),
      );
      if (!arrivalDir) continue;
      const branches = PERP[arrivalDir];

      const branchVisited = new Set(visited);
      const branchA = walkPath(size, splitCell, branches[0], tier.branchMinLen, tier.branchMaxLen, tier.turnProb, branchVisited, rng);
      const branchB = walkPath(size, splitCell, branches[1], tier.branchMinLen, tier.branchMaxLen, tier.turnProb, branchVisited, rng);
      if (!branchA || !branchB) continue;

      const truncatedMirrors = path1.mirrors.filter((m) => {
        const mIdx = path1.cells.findIndex((c) => key(c) === key(m));
        return mIdx <= idx;
      });
      allMirrors = [...truncatedMirrors, ...branchA.mirrors, ...branchB.mirrors];
      targets = [branchA.endPos, branchB.endPos];
    } else {
      targets = [path1.endPos];
    }

    let valid = true;
    for (const t of targets) {
      if (grid[t.y][t.x].type !== 'empty') { valid = false; break; }
      grid[t.y][t.x] = { type: 'target' };
    }
    if (!valid) continue;
    if (splitterPos) grid[splitterPos.y][splitterPos.x] = { type: 'splitter' };

    let validMirrors = true;
    for (const m of allMirrors) {
      if (grid[m.y][m.x].type !== 'empty') { validMirrors = false; break; }
    }
    if (!validMirrors) continue;
    if (allMirrors.length < 1) continue; // trivial puzzle, reject

    const solvedGrid = grid.map((row) => row.map((c) => ({ ...c })));
    for (const m of allMirrors) solvedGrid[m.y][m.x] = { type: 'mirror', orientation: m.orientation };
    if (!isSolved(solvedGrid)) continue;

    const puzzleGrid = grid.map((row) => row.map((c) => ({ ...c })));

    return {
      index: levelIndex,
      size,
      grid: puzzleGrid,
      mirrorBudget: allMirrors.length,
      targetCount: targets.length,
      solution: allMirrors,
    };
  }

  throw new Error(`Failed to generate level ${levelIndex} after 60 attempts`);
}

// Desired mirror-budget band per level, used only to pick a pleasant seed
// out of many valid procedural candidates — keeps the difficulty curve
// smooth without hand-authoring any level.
const BUDGET_TARGET: [number, number][] = [
  [1, 1], [1, 2], [2, 2], [2, 3], [2, 3],
  [3, 4], [3, 4], [4, 5], [4, 5], [5, 6],
];

/** Deterministically picks a pleasant seed for this level (one whose
 * generated mirror budget falls in the intended difficulty band) and
 * generates it. Same level index always yields the same puzzle. */
export function generateLevel(levelIndex: number): LevelData {
  const [lo, hi] = BUDGET_TARGET[Math.min(levelIndex - 1, BUDGET_TARGET.length - 1)];
  const baseSeed = levelIndex * 7919 + 13;
  let fallback: LevelData | null = null;

  for (let i = 0; i < 40; i++) {
    let level: LevelData;
    try {
      level = generateLevelWithSeed(levelIndex, baseSeed + i * 104729);
    } catch {
      continue;
    }
    if (!fallback) fallback = level;
    if (level.mirrorBudget >= lo && level.mirrorBudget <= hi) return level;
  }
  return fallback ?? generateLevelWithSeed(levelIndex, baseSeed);
}
