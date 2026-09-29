import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAppData } from './AppDataContext.jsx';
import { isOverdue, isDueToday } from '../utils/helpers.js';

const NotificationContext = createContext(null);

const READ_KEY = 'workpulse_notifications_read';
const DISMISSED_KEY = 'workpulse_notifications_dismissed';

function buildNotifications(tasks, meetings, items) {
  const list = [];
  const now = new Date();

  // ─── TASKS ─────────────────────────────────────
  tasks.forEach(t => {
    if (t.done) return;
    if (t.dueDate && isOverdue(t.dueDate)) {
      list.push({
        id: `task-overdue-${t.id}`,
        type: 'task',
        targetId: t.id,
        targetType: 'task',
        path: `/tasks?open=${t.id}`,
        severity: 'danger',
        icon: 'fa-exclamation-triangle',
        title: 'Task overdue',
        message: t.text,
        timestamp: new Date(t.dueDate + 'T00:00:00').getTime(),
      });
    } else if (t.dueDate && isDueToday(t.dueDate)) {
      list.push({
        id: `task-today-${t.id}`,
        type: 'task',
        targetId: t.id,
        targetType: 'task',
        path: `/tasks?open=${t.id}`,
        severity: 'warning',
        icon: 'fa-clock',
        title: 'Task due today',
        message: t.text,
        timestamp: Date.now(),
      });
    }
  });

  // ─── MEETINGS ──────────────────────────────────
  meetings.forEach(m => {
    if (m.completed || !m.date) return;
    const meetingDate = new Date(`${m.date}T${m.time || '00:00'}`);
    const diffHours = (meetingDate - now) / (1000 * 60 * 60);
    if (diffHours >= 0 && diffHours <= 24) {
      list.push({
        id: `meeting-${m.id}`,
        type: 'meeting',
        targetId: m.id,
        targetType: 'meeting',
        path: `/meetings?open=${m.id}`,
        severity: 'info',
        icon: 'fa-calendar-alt',
        title: 'Upcoming meeting',
        message: `${m.title} • ${m.time || 'TBD'}`,
        timestamp: meetingDate.getTime(),
      });
    }
  });

  // ─── ITEMS ─────────────────────────────────────
  items.forEach(i => {
    if (!i.nextCheck) return;
    if (i.status === 'completed' || i.status === 'cancelled') return;
    const next = new Date(i.nextCheck + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
    const label = i.text || i.title || 'Untitled item';
    if (diffDays < 0) {
      list.push({
        id: `item-overdue-${i.id}`,
        type: 'item',
        targetId: i.id,
        targetType: 'item',
        path: `/items?open=${i.id}`,
        severity: 'danger',
        icon: 'fa-exclamation-circle',
        title: 'Check-in overdue',
        message: label,
        timestamp: next.getTime(),
      });
    } else if (diffDays <= 2) {
      list.push({
        id: `item-checkin-${i.id}`,
        type: 'item',
        targetId: i.id,
        targetType: 'item',
        path: `/items?open=${i.id}`,
        severity: 'warning',
        icon: 'fa-clipboard-check',
        title: 'Check-in due soon',
        message: label,
        timestamp: next.getTime(),
      });
    }
  });

  return list.sort((a, b) => b.timestamp - a.timestamp);
}

function loadSet(key) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSet(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error(`Failed to save ${key}:`, e);
  }
}

export function NotificationProvider({ children }) {
  const { tasks, meetings, items } = useAppData();
  const [readIds, setReadIds] = useState(() => loadSet(READ_KEY));
  const [dismissedIds, setDismissedIds] = useState(() => loadSet(DISMISSED_KEY));

  const allNotifications = useMemo(
    () => buildNotifications(tasks, meetings, items),
    [tasks, meetings, items]
  );

  // Filter out dismissed
  const notifications = useMemo(
    () => allNotifications.filter(n => !dismissedIds.has(n.id)),
    [allNotifications, dismissedIds]
  );

  // ─── AUTO-CLEANUP STALE IDS ────────────────────
  useEffect(() => {
    const currentIds = new Set(allNotifications.map(n => n.id));
    setReadIds(prev => {
      const cleaned = new Set([...prev].filter(id => currentIds.has(id)));
      return cleaned.size !== prev.size ? cleaned : prev;
    });
    setDismissedIds(prev => {
      const cleaned = new Set([...prev].filter(id => currentIds.has(id)));
      return cleaned.size !== prev.size ? cleaned : prev;
    });
  }, [allNotifications]);

  // Persist
  useEffect(() => { saveSet(READ_KEY, readIds); }, [readIds]);
  useEffect(() => { saveSet(DISMISSED_KEY, dismissedIds); }, [dismissedIds]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !readIds.has(n.id)).length,
    [notifications, readIds]
  );

  const markAsRead = (id) => {
    setReadIds(prev => new Set(prev).add(id));
  };

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  const dismiss = (id) => {
    setDismissedIds(prev => new Set(prev).add(id));
  };

  const dismissAll = () => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      return next;
    });
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      readIds,
      dismissedIds,
      markAsRead,
      markAllAsRead,
      dismiss,
      dismissAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
