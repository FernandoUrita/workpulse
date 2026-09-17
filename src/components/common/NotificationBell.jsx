import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { formatDateTime } from '../../utils/helpers.js';

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    readIds,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // Close on outside click
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

  const handleItemClick = (id) => {
    markAsRead(id);
  };

  return (
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
              {notifications.length > 0 && unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-mark-all"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="notif-list">
              {notifications.length === 0 ? (
                <div className="notif-empty">
                  <i className="fas fa-check-circle"></i>
                  <p>You're all caught up!</p>
                  <span>No new notifications</span>
                </div>
              ) : (
                notifications.map(n => {
                  const isRead = readIds.has(n.id);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      className={`notif-item ${n.severity} ${isRead ? 'read' : 'unread'}`}
                      onClick={() => handleItemClick(n.id)}
                    >
                      <div className={`notif-item-icon ${n.severity}`}>
                        <i className={`fas ${n.icon}`}></i>
                      </div>
                      <div className="notif-item-content">
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-message">{n.message}</div>
                        <div className="notif-item-time">
                          {formatDateTime(n.timestamp)}
                        </div>
                      </div>
                      {!isRead && <span className="notif-dot"></span>}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
