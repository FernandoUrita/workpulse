import { REMINDER_LEVELS, reminderLevel } from '../../utils/reminderLevels.js';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../../context/NotificationContext.jsx';
import SendNotificationModal from './SendNotificationModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { enablePush, disablePush } from '../../pwa/push.js';
import { useNotificationExperience } from '../../context/NotificationExperience.jsx';
import { formatDateTime } from '../../utils/helpers.js';

export default function NotificationBell() {
  const {
    notifications,
    realtimeStatus,
    error,
    loading,
    refetch,
    unreadCount,
    readIds,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
  } = useNotifications();
  const { currentUser } = useAuth();
  const { desktopEnabled, soundEnabled, setSound, toggleDesktop, testAlert, testDesktop, preferenceMessage } = useNotificationExperience();
  const [compose, setCompose] = useState(false);
  const [pushMessage, setPushMessage] = useState('');
  const [pushBusy, setPushBusy] = useState(false);
  const changePush = async enabled => {
    setPushBusy(true);
    try {
      await (enabled ? enablePush(currentUser.id) : disablePush(currentUser.id));
      setPushMessage(enabled ? 'Browser push enabled on this device.' : 'Browser push disabled on this device.');
    } catch (err) { setPushMessage(err.message); }
    finally { setPushBusy(false); }
  };
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const handleNotificationClick = async (notification) => {
    const saved = await markAsRead(notification.id);
    if (!saved) return;
    setOpen(false);
    if (notification.path) {
      navigate(notification.path);
    }
  };

  const handleDismiss = (e, id) => {
    e.stopPropagation();
    dismiss(id);
  };

  return (
    <>
    <div className="notif-wrapper">
      <button
        ref={buttonRef}
        type="button"
        className="icon-btn notif-bell"
        onClick={() => setOpen(prev => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        title="Notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <motion.span
            className="notif-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            className="notif-panel"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="notif-header">
              <h4>
                <i className="fas fa-bell"></i> Notifications
                {unreadCount > 0 && (
                  <span className="notif-header-count">{unreadCount}</span>
                )}
              </h4>
              {notifications.length > 0 && (
                <div className="notif-header-actions">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notif-mark-all"
                      onClick={markAllAsRead}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    className="notif-mark-all"
                    onClick={dismissAll}
                    title="Clear all notifications"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            <div style={{ padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['head', 'admin'].includes(currentUser?.role) && <button type="button" className="btn" onClick={() => { setOpen(false); setCompose(true); }}>Send reminder</button>}
              <button type="button" className="btn" disabled={pushBusy} onClick={() => changePush(true)}>Enable browser push</button>
              <button type="button" className="btn" disabled={pushBusy} onClick={() => changePush(false)}>Disable push</button>
              {pushMessage && <p role="status">{pushMessage}</p>}
            </div>
            <div className="notif-preferences">
              <button type="button" className="secondary-btn" aria-pressed={desktopEnabled} onClick={toggleDesktop}>
                <i className="fas fa-desktop" aria-hidden="true"></i> {desktopEnabled ? 'Desktop alerts: On' : 'Enable desktop alerts'}
              </button>
              <button type="button" className="secondary-btn" aria-pressed={soundEnabled} onClick={() => setSound(!soundEnabled)}>
                <i className={`fas ${soundEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`} aria-hidden="true"></i> Sound: {soundEnabled ? 'On' : 'Off'}
              </button>
              <button type="button" className="secondary-btn" onClick={testAlert}>Test popup & sound</button>
              <button type="button" className="secondary-btn" onClick={testDesktop}>Test desktop (5 seconds)</button>
              <p>Live connection: {realtimeStatus}. Backup check: every 8 seconds.</p>
              {preferenceMessage && <p role="status">{preferenceMessage}</p>}
            </div>
            {error && (
              <div role="alert" style={{ padding: '12px', color: '#b91c1c' }}>
                {error} <button type="button" onClick={refetch}>Retry</button>
              </div>
            )}
            <div className="notif-list" aria-busy={loading}>
              {notifications.length === 0 ? (
                <div className="notif-empty">
                  <i className="fas fa-check-circle"></i>
                  <p>{loading ? 'Loading notifications…' : "You're all caught up!"}</p>
                  <span>No new notifications</span>
                </div>
              ) : (
                notifications.map(n => {
                  const isRead = readIds.has(n.id);
                  return (
                    <div
                      key={n.id}
                      className={`notif-item reminder-level-${reminderLevel(n)} ${n.severity} ${isRead ? 'read' : 'unread'}`}
                      onClick={() => handleNotificationClick(n)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleNotificationClick(n);
                        }
                      }}
                    >
                      <div className={`notif-item-icon ${n.severity}`}>
                        <i className={`fas ${n.icon}`}></i>
                      </div>
                      <div className="notif-item-content">
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-reminder-label">{REMINDER_LEVELS[reminderLevel(n)].label}</div><div className="notif-item-message">{n.message}</div>
                        <div className="notif-item-time">
                          {formatDateTime(n.timestamp)}
                        </div>
                      </div>
                      {!isRead && <span className="notif-dot"></span>}
                      <button
                        type="button"
                        className="notif-dismiss"
                        onClick={(e) => handleDismiss(e, n.id)}
                        aria-label="Dismiss notification"
                        title="Dismiss"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    {compose && <SendNotificationModal onClose={() => setCompose(false)} />}
    </>
  );
}
