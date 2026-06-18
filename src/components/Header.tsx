interface HeaderProps {
  onOpenLevels: () => void;
  onOpenHowTo: () => void;
}

export default function Header({ onOpenLevels, onOpenHowTo }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand">
        <h1 className="brand-title">Refract</h1>
        <span className="brand-tagline">route the light · ignite the crystals</span>
      </div>
      <div className="header-controls">
        <button className="icon-btn" onClick={onOpenHowTo}>
          How to play
        </button>
        <button className="icon-btn" onClick={onOpenLevels}>
          Levels
        </button>
      </div>
    </header>
  );
}
