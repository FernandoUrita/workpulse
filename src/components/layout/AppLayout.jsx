import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onToggle={closeSidebar} />
      
      {/* Overlay for mobile when sidebar open */}
      {sidebarOpen && (
        <div 
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 99,
            display: 'none',
          }}
          className="sidebar-overlay"
        />
      )}

      <main className="main-content">
        <Topbar 
          currentPath={location.pathname} 
          onMenuClick={toggleSidebar} 
        />
        <Outlet />
      </main>
    </div>
  );
}
