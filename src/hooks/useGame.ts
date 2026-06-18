import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Grid, MirrorPlacement } from '../engine/types';
import { isSolved, simulateBeams } from '../engine/beam';
import { generateLevel, TOTAL_LEVELS } from '../engine/levelGenerator';
import { solve } from '../engine/solver';

const STORAGE_KEY = 'refract-progress-v1';

interface LevelProgress {
  stars: number;
  hintsUsed: number;
}

interface Progress {
  completed: Record<number, LevelProgress>;
  highestUnlocked: number;
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {
    // ignore corrupt/unavailable storage
  }
  return { completed: {}, highestUnlocked: 1 };
}

function saveProgress(p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // storage unavailable (private browsing, etc.) — fail silently
  }
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((c) => ({ ...c })));
}

function countMirrors(grid: Grid): number {
  let n = 0;
  for (const row of grid) for (const c of row) if (c.type === 'mirror') n++;
  return n;
}

function starsFor(hintsUsed: number): number {
  if (hintsUsed === 0) return 3;
  if (hintsUsed <= 1) return 2;
  return 1;
}

export function useGame() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [levelIndex, setLevelIndex] = useState(1);
  const [levelData, setLevelData] = useState(() => generateLevel(1));
  const [playerGrid, setPlayerGrid] = useState<Grid>(() => cloneGrid(levelData.grid));
  const [history, setHistory] = useState<Grid[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [justSolved, setJustSolved] = useState(false);
  const [hintCell, setHintCell] = useState<MirrorPlacement | null>(null);

  const loadLevel = useCallback((index: number) => {
    const data = generateLevel(index);
    setLevelIndex(index);
    setLevelData(data);
    setPlayerGrid(cloneGrid(data.grid));
    setHistory([]);
    setHintsUsed(0);
    setJustSolved(false);
    setHintCell(null);
  }, []);

  const placedMirrors = useMemo(() => countMirrors(playerGrid), [playerGrid]);
  const remainingBudget = levelData.mirrorBudget - placedMirrors;
  const simulation = useMemo(() => simulateBeams(playerGrid), [playerGrid]);
  const solved = useMemo(() => isSolved(playerGrid), [playerGrid]);

  // detect a fresh solve and persist progress
  useEffect(() => {
    if (!solved) return;
    setJustSolved(true);
    setProgress((prev) => {
      const stars = starsFor(hintsUsed);
      const existing = prev.completed[levelIndex];
      const best = existing && existing.stars > stars ? existing : { stars, hintsUsed };
      const next: Progress = {
        completed: { ...prev.completed, [levelIndex]: best },
        highestUnlocked: Math.max(prev.highestUnlocked, Math.min(levelIndex + 1, TOTAL_LEVELS)),
      };
      saveProgress(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved]);

  const pushHistory = useCallback((grid: Grid) => {
    setHistory((h) => [...h, cloneGrid(grid)]);
  }, []);

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (solved) return;
      const cell = playerGrid[y][x];
      if (cell.type !== 'empty' && cell.type !== 'mirror') return; // locked terrain

      pushHistory(playerGrid);
      const next = cloneGrid(playerGrid);

      if (cell.type === 'empty') {
        if (remainingBudget <= 0) {
          setHistory((h) => h.slice(0, -1)); // nothing changed, drop the snapshot
          return;
        }
        next[y][x] = { type: 'mirror', orientation: '/' };
      } else if (cell.orientation === '/') {
        next[y][x] = { type: 'mirror', orientation: '\\' };
      } else {
        next[y][x] = { type: 'empty' };
      }
      setHintCell(null);
      setPlayerGrid(next);
    },
    [playerGrid, remainingBudget, solved, pushHistory],
  );

  const resetLevel = useCallback(() => {
    setPlayerGrid(cloneGrid(levelData.grid));
    setHistory([]);
    setHintsUsed(0);
    setHintCell(null);
  }, [levelData]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prevGrid = h[h.length - 1];
      setPlayerGrid(prevGrid);
      return h.slice(0, -1);
    });
    setHintCell(null);
  }, []);

  const useHint = useCallback(() => {
    if (solved || remainingBudget <= 0) return;
    const result = solve(playerGrid, remainingBudget);
    if (!result || result.length === 0) return;
    const move = result[0];
    pushHistory(playerGrid);
    const next = cloneGrid(playerGrid);
    next[move.y][move.x] = { type: 'mirror', orientation: move.orientation };
    setPlayerGrid(next);
    setHintsUsed((n) => n + 1);
    setHintCell(move);
  }, [playerGrid, remainingBudget, solved, pushHistory]);

  const nextLevel = useCallback(() => {
    const next = Math.min(levelIndex + 1, TOTAL_LEVELS);
    loadLevel(next);
  }, [levelIndex, loadLevel]);

  return {
    levelIndex,
    totalLevels: TOTAL_LEVELS,
    levelData,
    playerGrid,
    simulation,
    solved,
    justSolved,
    dismissSolved: () => setJustSolved(false),
    mirrorBudget: levelData.mirrorBudget,
    placedMirrors,
    remainingBudget,
    hintsUsed,
    hintCell,
    canUndo: history.length > 0,
    progress,
    isLastLevel: levelIndex >= TOTAL_LEVELS,
    handleCellClick,
    resetLevel,
    undo,
    useHint,
    nextLevel,
    selectLevel: loadLevel,
  };
}
