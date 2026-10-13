import { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import PwaControls from '../common/PwaControls.jsx';
import PageSkeleton from '../common/PageSkeleton.jsx';
import PageTransition from '../common/PageTransition.jsx';
import CommandPalette from '../common/CommandPalette.jsx';
import { useCommandPalette } from '../../hooks/useCommandPalette.js';
import { useAppData } from '../../context/AppDataContext.jsx';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(() => { try { return localStorage.getItem('workpulse:sidebar-minimized') === 'true'; } catch { return false; } });
  const minimizeSidebar = () => setSidebarMinimized(previous => { const next = !previous; try { localStorage.setItem('workpulse:sidebar-minimized', String(next)); } catch { /* Session preference remains available. */ } return next; });
  const location = useLocation();
  const { loading } = useAppData();
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={`app-container ${sidebarMinimized ? 'sidebar-minimized' : ''}`}>
      <Sidebar isOpen={sidebarOpen} onToggle={closeSidebar} minimized={sidebarMinimized} onMinimize={minimizeSidebar} />

      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          className="sidebar-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 99,
          }}
        />
      )}

      <main className="main-content">
        <Topbar
          currentPath={location.pathname}
          onMenuClick={toggleSidebar}
          onOpenCommandPalette={() => setPaletteOpen(true)}
        />
        <PwaControls showInstall={location.pathname === '/settings'} />
        <PageTransition routeKey={location.pathname}>
          <Suspense fallback={<PageSkeleton />}>
            {loading ? <PageSkeleton /> : <Outlet />}
          </Suspense>
        </PageTransition>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
