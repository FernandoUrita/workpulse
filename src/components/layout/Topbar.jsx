import ThemeToggle from '../common/ThemeToggle.jsx';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Task Management',
  '/meetings': 'Meeting Management',
  '/items': 'Items Management',
  '/mom': 'MOM Templates',
  '/settings': 'Settings',
};

export default function Topbar({ currentPath, onMenuClick, onOpenCommandPalette }) {
  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const title = PAGE_TITLES[currentPath] || 'Dashboard';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={onMenuClick} aria-label="Open navigation">
          <i className="fas fa-bars"></i>
        </button>
        <h2>{title}</h2>
      </div>
      <div className="topbar-right">
        <button
          type="button"
          className="cmd-trigger"
          onClick={onOpenCommandPalette}
          aria-label="Open command palette"
          title="Open command palette (Ctrl+K)"
        >
          <i className="fas fa-search"></i>
          <span className="cmd-trigger-text">Search…</span>
          <kbd className="cmd-trigger-kbd">Ctrl K</kbd>
        </button>
        <span className="date-display">{today}</span>
        <ThemeToggle />
      </div>
    </header>
  );
}
