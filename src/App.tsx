import { useState } from 'react';
import { useGame } from './hooks/useGame';
import Header from './components/Header';
import Grid from './components/Grid';
import LevelSelect from './components/LevelSelect';
import WinOverlay from './components/WinOverlay';
import HowToPlay from './components/HowToPlay';

function starsFor(hintsUsed: number): number {
  if (hintsUsed === 0) return 3;
  if (hintsUsed <= 1) return 2;
  return 1;
}

export default function App() {
  const game = useGame();
  const [showLevels, setShowLevels] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  return (
    <div className="app">
      <Header onOpenLevels={() => setShowLevels(true)} onOpenHowTo={() => setShowHowTo(true)} />

      <div className="game-panel">
        <div className="level-meta">
          <div className="level-meta-left">
            <span className="level-number">
              LEVEL {game.levelIndex} / {game.totalLevels}
            </span>
            <span className="mirror-budget">
              MIRRORS
              <span className="mirror-pips">
                {Array.from({ length: game.mirrorBudget }, (_, i) => (
                  <span key={i} className={`mirror-pip${i < game.placedMirrors ? ' used' : ''}`} />
                ))}
              </span>
            </span>
          </div>
          <div className="header-controls">
            <button className="icon-btn" onClick={game.undo} disabled={!game.canUndo}>
              Undo
            </button>
            <button className="icon-btn" onClick={game.resetLevel}>
              Reset
            </button>
            <button className="icon-btn" onClick={game.useHint} disabled={game.solved || game.remainingBudget <= 0}>
              Hint
            </button>
          </div>
        </div>

        <div className="grid-wrap">
          <Grid
            grid={game.playerGrid}
            simulation={game.simulation}
            solved={game.solved}
            hintCell={game.hintCell}
            onCellClick={game.handleCellClick}
          />
        </div>

        <p className="helper-text">
          Click an empty cell to place a mirror, click again to flip it, and once more to remove it. Light every
          crystal to ignite the level.
        </p>
      </div>

      {showLevels && (
        <LevelSelect
          totalLevels={game.totalLevels}
          currentLevel={game.levelIndex}
          highestUnlocked={game.progress.highestUnlocked}
          completed={game.progress.completed}
          onSelect={game.selectLevel}
          onClose={() => setShowLevels(false)}
        />
      )}

      {showHowTo && <HowToPlay onClose={() => setShowHowTo(false)} />}

      {game.justSolved && (
        <WinOverlay
          levelIndex={game.levelIndex}
          totalLevels={game.totalLevels}
          mirrorsUsed={game.placedMirrors}
          mirrorBudget={game.mirrorBudget}
          hintsUsed={game.hintsUsed}
          stars={starsFor(game.hintsUsed)}
          isLastLevel={game.isLastLevel}
          onNext={() => {
            game.dismissSolved();
            game.nextLevel();
          }}
          onReplay={() => {
            game.dismissSolved();
            game.resetLevel();
          }}
          onClose={game.dismissSolved}
        />
      )}

      <p className="footer-note">
        Built with React + TypeScript · procedurally generated &amp; solver-verified levels
      </p>
    </div>
  );
}
