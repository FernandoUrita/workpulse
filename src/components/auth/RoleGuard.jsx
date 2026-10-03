import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * RoleGuard — protects routes based on user role.
 * 
 * Usage:
 *   <RoleGuard allowedRoles={['head', 'admin']}>
 *     <HeadReportsPage />
 *   </RoleGuard>
 */
export default function RoleGuard({ allowedRoles = [], children, redirectTo = '/dashboard' }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
      }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px' }}></i>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
