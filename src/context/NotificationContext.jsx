import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAppData } from './AppDataContext.jsx';
import { isOverdue, isDueToday } from '../utils/helpers.js';

const NotificationContext = createContext(null);

const STORAGE_KEY = 'workpulse_notifications_read';

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
    if (diffDays < 0) {
      list.push({
        id: `item-overdue-${i.id}`,
        type: 'item',
        severity: 'danger',
        icon: 'fa-exclamation-circle',
        title: 'Check-in overdue',
        message: i.text || i.title || 'Untitled item',
        timestamp: next.getTime(),
      });
    } else if (diffDays <= 2) {
      list.push({
        id: `item-checkin-${i.id}`,
        type: 'item',
        severity: 'warning',
        icon: 'fa-clipboard-check',
        title: 'Check-in due soon',
        message: i.text || i.title || 'Untitled item',
        timestamp: next.getTime(),
      });
    }
  });

  // Sort: newest first
  return list.sort((a, b) => b.timestamp - a.timestamp);
}

export function NotificationProvider({ children }) {
  const { tasks, meetings, items } = useAppData();
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist read IDs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(readIds)));
    } catch (e) {
      console.error('Failed to save notifications:', e);
    }
  }, [readIds]);

  const notifications = useMemo(
    () => buildNotifications(tasks, meetings, items),
    [tasks, meetings, items]
  );

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

  const clearAll = () => {
    markAllAsRead();
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      readIds,
      markAsRead,
      markAllAsRead,
      clearAll,
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
