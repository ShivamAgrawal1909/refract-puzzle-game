export type Direction = 'N' | 'E' | 'S' | 'W';
export type Orientation = '/' | '\\';

export type CellType = 'empty' | 'wall' | 'mirror' | 'emitter' | 'target' | 'splitter';

export interface Cell {
  type: CellType;
  orientation?: Orientation; // mirror only
  dir?: Direction; // emitter only
}

export type Grid = Cell[][];

export interface Point {
  x: number;
  y: number;
}

export interface BeamSegment {
  points: [number, number][];
}

export interface SimulationResult {
  litTargets: Set<string>;
  segments: BeamSegment[];
}

export interface MirrorPlacement extends Point {
  orientation: Orientation;
}

export interface LevelData {
  index: number;
  size: number;
  grid: Grid;
  mirrorBudget: number;
  targetCount: number;
  solution: MirrorPlacement[];
}
