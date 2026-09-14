import { useTheme } from '../../context/ThemeContext.jsx';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Task Management',
  '/meetings': 'Meeting Management',
  '/items': 'Items Management',
  '/mom': 'MOM Templates',
  '/settings': 'Settings',
};

export default function Topbar({ currentPath, onMenuClick }) {
  const { theme, toggleTheme } = useTheme();

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
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          <i className="fas fa-bars"></i>
        </button>
        <h2>{title}</h2>
      </div>
      <div className="topbar-right">
        <span className="date-display">{today}</span>
        <button className="icon-btn" onClick={toggleTheme}>
          <i className={`fas fa-${theme === 'dark' ? 'sun' : 'moon'}`}></i>
        </button>
      </div>
    </header>
  );
}
