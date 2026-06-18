# Refract

A light-routing puzzle game. Rotate mirrors to redirect a laser beam through splitters and into every crystal target, using as few mirrors as possible.

Built as a portfolio project to demonstrate two things equally: **algorithmic problem-solving** (procedural level generation, a constraint-search solver, beam ray-tracing) and **polished, intentional UI/UX** (a custom dark optics-lab visual identity, SVG-rendered beams with glow, and a signature "ignite" animation on solve).

## Running it

```bash
npm install
npm run dev
```

Then open the printed local URL. To produce a production build:

```bash
npm run build
npm run preview
```

The project has no backend — it's a static site, so it deploys as-is to Vercel, Netlify, or GitHub Pages (just point any of them at the build output of `npm run build`, which lands in `dist/`).

## How it works

### The engine (`src/engine/`)

- **`types.ts`** — shared types for the grid, cells, and simulation results.
- **`beam.ts`** — `simulateBeams(grid)` ray-traces every emitter through the grid, handling mirror reflection, splitter branching, wall/target absorption, and cycle detection (a closed loop of mirrors can't hang the simulation — visited `(x, y, direction)` states are tracked and any repeat ends that beam).
- **`levelGenerator.ts`** — levels are generated, not hand-authored. For each level the generator walks a random path from an edge-emitter, occasionally turning (which requires a mirror) and optionally splitting into two branches that each end at a target. It then verifies the constructed solution actually solves the puzzle, and strips the mirrors back out to produce the playable puzzle. A difficulty curve (`DIFFICULTY` table) tunes grid size, path length, and branch usage across ten levels, and a seed-search wrapper picks the candidate whose required mirror budget best matches a target band per level, so difficulty progresses smoothly instead of swinging wildly between levels.
- **`solver.ts`** — a backtracking solver used for the in-game hint system. Rather than searching every empty cell on the board, it restricts candidates to cells the beam already passes through (computed via `simulateBeams`), which prunes the search space enough that even the largest level (9×9, 6-mirror budget) solves in well under 30ms.
- **`rng.ts`** — a small seeded PRNG (`mulberry32`) so level generation is deterministic and reproducible from a level index.

### The UI (`src/components/`, `src/hooks/useGame.ts`)

`useGame` owns all game state — the current level, the player's mutable grid, an undo history stack, hint count, and `localStorage`-persisted progress (stars and unlocked levels) — and exposes actions (`handleCellClick`, `undo`, `resetLevel`, `useHint`, `selectLevel`, `nextLevel`). Components are kept presentational and read everything from the hook.

`Grid.tsx` renders the board as SVG rather than HTML/CSS so beams can be drawn as true glowing polylines (an SVG `feGaussianBlur` filter) following the exact coordinate path the engine traced — there's no separate "beam visual" logic to keep in sync with the simulation. When a level is solved, the beam paths pick up a looping `hue-rotate` animation (the "ignite" moment) and lit crystals pulse.

## Design notes

The visual language is a dark optics-lab palette — everything in the lab itself is desaturated indigo/charcoal specifically so the light (beams, the ignited crystal pink, the amber emitter) reads as the only real color in the frame. Type pairs a geometric display face (Space Grotesk) for the brand against a monospace (JetBrains Mono) for anything numeric — level counters, mirror budget — to read like instrumentation rather than marketing copy.

## Stack

React 18 + TypeScript, built with Vite. No state management library or CSS framework — state lives in one hook, styling is a single hand-written stylesheet using CSS custom properties as design tokens.
