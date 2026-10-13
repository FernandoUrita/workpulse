import ThemeToggle from '../common/ThemeToggle.jsx';
import NotificationBell from '../common/NotificationBell.jsx';

export default function Topbar({ currentPath, onMenuClick, onOpenCommandPalette }) {
  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const title = currentPath.startsWith('/projects')?'Projects':(['/tasks','/tickets','/items'].includes(currentPath)?'Support':['/meetings','/mom'].includes(currentPath)?'Coordination':['/reports','/users'].includes(currentPath)?'Management':'Workspace');

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={onMenuClick} aria-label="Open navigation">
          <i className="fas fa-bars"></i>
        </button>
<<<<<<< HEAD
        <div className="wp-breadcrumb"><span>{title}</span><span aria-hidden="true">/</span><strong>{({'/dashboard':'Dashboard','/tasks':'Tasks','/tickets':'Tickets','/items':'Support items','/meetings':'Meetings','/mom':'MOM Templates','/projects':'Project tables','/projects/monitoring':'Monitoring','/reports':'Reports','/users':'Users','/activity':'Activity','/settings':'Settings'})[currentPath]||'Overview'}</strong></div>
=======
        <h2>{title}</h2>
>>>>>>> cfe308f0e4c7181f662947f40efa60a124262d45
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
        <NotificationBell />
        <span className="date-display">{today}</span>
        <ThemeToggle />
      </div>
    </header>
  );
}
