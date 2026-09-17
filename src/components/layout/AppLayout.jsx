import { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import PwaControls from '../common/PwaControls.jsx';
import PageSkeleton from '../common/PageSkeleton.jsx';
import PageTransition from '../common/PageTransition.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { loading } = useAppData();

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onToggle={closeSidebar} />

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
        />
        <PwaControls />
        <PageTransition routeKey={location.pathname}>
          <Suspense fallback={<PageSkeleton />}>
            {loading ? <PageSkeleton /> : <Outlet />}
          </Suspense>
        </PageTransition>
      </main>
    </div>
  );
}
