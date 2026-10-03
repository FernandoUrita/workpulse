import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'fa-th-large', roles: ['employee', 'head', 'admin'] },
  { path: '/tasks', label: 'Tasks', icon: 'fa-tasks', badgeKey: 'tasks', roles: ['employee', 'head', 'admin'] },
  { path: '/meetings', label: 'Meetings', icon: 'fa-calendar-alt', badgeKey: 'meetings', roles: ['employee', 'head', 'admin'] },
  { path: '/items', label: 'Items', icon: 'fa-box', badgeKey: 'items', roles: ['employee', 'head', 'admin'] },
  { path: '/tickets', label: 'Tickets', icon: 'fa-ticket-alt', badgeKey: 'tickets', roles: ['employee', 'head', 'admin'] },
  { path: '/mom', label: 'MOM Templates', icon: 'fa-file-alt', roles: ['employee', 'head', 'admin'] },
  { path: '/activity', label: 'Activity', icon: 'fa-stream', roles: ['employee', 'head', 'admin'] },
  // Head + Admin only
  { path: '/reports', label: 'Reports', icon: 'fa-chart-line', roles: ['head', 'admin'] },
  // Admin only
  { path: '/users', label: 'Users', icon: 'fa-users-cog', roles: ['admin'] },
  { path: '/settings', label: 'Settings', icon: 'fa-cog', roles: ['employee', 'head', 'admin'] },
];

export default function Sidebar({ isOpen, onToggle }) {
  const { currentUser, logout } = useAuth();
  const { tasks, meetings, items, tickets } = useAppData();

  // Badge: bilangin lang yung PENDING (hindi completed) tasks
  const badges = {
    tasks: tasks.filter(t => !t.done).length,
    meetings: meetings.filter(m => !m.completed).length,
    items: items.filter(i => i.status !== 'completed' && i.status !== 'cancelled').length,
    tickets: (tickets || []).filter(t => t.status !== 'Closed' && t.status !== 'On Hold').length,
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <i className="fas fa-heartbeat"></i>
          <h2>Work<span>Pulse</span></h2>
        </div>
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Close navigation">
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
          {NAV_ITEMS.filter(item => !item.roles || item.roles.includes(currentUser?.role)).map(item => (
            <li key={item.path} className="nav-item">
              <NavLink
                to={item.path}
                onClick={onToggle}
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
        <div className="version">
          v2.0.0
          {currentUser?.role && (
            <span className={`role-badge role-${currentUser.role}`}>
              {currentUser.role}
            </span>
          )}
        </div>
        <ThemeToggle className="theme-toggle-sidebar" />
      </div>
    </aside>
  );
}
