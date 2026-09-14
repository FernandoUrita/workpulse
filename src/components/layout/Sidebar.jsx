import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'fa-th-large' },
  { path: '/tasks', label: 'Tasks', icon: 'fa-tasks', badgeKey: 'tasks' },
  { path: '/meetings', label: 'Meetings', icon: 'fa-calendar-alt', badgeKey: 'meetings' },
  { path: '/items', label: 'Items', icon: 'fa-box', badgeKey: 'items' },
  { path: '/mom', label: 'MOM Templates', icon: 'fa-file-alt' },
  { path: '/settings', label: 'Settings', icon: 'fa-cog' },
];

export default function Sidebar({ isOpen, onToggle }) {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { tasks, meetings, items } = useAppData();

  const badges = {
    tasks: tasks.length,
    meetings: meetings.length,
    items: items.length,
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <i className="fas fa-heartbeat"></i>
          <h2>Work<span>Pulse</span></h2>
        </div>
        <button className="sidebar-toggle" onClick={onToggle}>
          <i className="fas fa-bars"></i>
        </button>
      </div>

      <div className="user-profile">
        <div className="user-avatar">
          <i className="fas fa-user-circle"></i>
        </div>
        <div className="user-info">
          <h4>{currentUser?.name || 'User'}</h4>
          <span>@{currentUser?.username || 'username'}</span>
        </div>
        <button className="logout-btn" onClick={logout} title="Logout">
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {NAV_ITEMS.map(item => (
            <li key={item.path} className="nav-item">
              <NavLink 
                to={item.path}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <i className={`fas ${item.icon}`}></i>
                <span>{item.label}</span>
                {item.badgeKey && badges[item.badgeKey] > 0 && (
                  <span className="badge">{badges[item.badgeKey]}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="version">v2.0.0</div>
        <button className="theme-toggle-sidebar" onClick={toggleTheme}>
          <i className={`fas fa-${theme === 'dark' ? 'sun' : 'moon'}`}></i>
        </button>
      </div>
    </aside>
  );
}
