# Refract

A little puzzle game I built where you bend a laser beam with mirrors to light up crystal targets on a grid. Think of it like a lasers-and-mirrors version of a logic puzzle — you get a fixed number of mirrors, an emitter firing in some direction, and you have to figure out where to place them (and which way to angle them) so the beam ends up hitting every target.

I wanted a project that wasn't just "looks nice" or just "has interesting logic" — I tried to make both sides solid: the puzzle logic actually works (levels are generated and checked for solvability, not just placed by hand), and the UI doesn't look like a default Bootstrap template either.

## Running it

```
npm install
npm run dev
```

That starts a local dev server — open whatever URL it prints (usually `http://localhost:5173`).

For a production build:

```
npm run build
npm run preview
```

It's just a static site at the end of the day, so it'll deploy fine to Vercel, Netlify, GitHub Pages, whatever — point it at the `dist/` folder that `npm run build` spits out.

## How the levels actually work

This was the part I spent the most time on. Instead of hand-placing mirrors for ten levels, I wrote a generator that works backwards: it starts at a random edge, walks a path through the grid (sometimes turning, which means a mirror needs to go there), occasionally branches off through a splitter, and ends at a target. Once it has a full working path, it checks that the path actually solves the puzzle, then strips the mirrors back out — what's left is the puzzle you actually play.

Every level gets verified before it's shown to anyone, so there's no chance of accidentally shipping an unsolvable level.

There's also a solver in there (`solver.ts`) that does a backtracking search to find a valid mirror placement — that's what powers the hint button. The naive way to do this would be checking every empty cell on the board, but I narrowed it down to only checking cells the beam already reaches, which cut the search space down a lot. Even on the biggest level (9x9 grid, 6 mirrors) it solves in under 30ms.

## The UI side

The grid is rendered as actual SVG instead of a bunch of divs, mainly because I wanted the beams to glow properly (there's an SVG blur filter behind them) and follow the exact path the simulation traces — no separate "draw the beam" logic that could get out of sync with what's actually happening underneath.

Color-wise I went with a dark, almost lab-equipment kind of palette — deep indigo background, desaturated panels — so that the beam color and the lit-up crystal pink actually stand out instead of competing with a busy UI. When you solve a level the beam animation cycles through hues for a second, which was probably my favorite small detail to get right.

## Stack

React + TypeScript, Vite for the build. No Redux or Zustand or anything — game state all lives in one hook (`useGame.ts`), and styling is one CSS file using custom properties instead of pulling in Tailwind or styled-components.

## License

MIT — see the LICENSE file.
