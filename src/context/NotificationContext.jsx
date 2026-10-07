import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from './AuthContext.jsx';
import { useAppData } from './AppDataContext.jsx';
import { isOverdue, isDueToday } from '../utils/helpers.js';

const NotificationContext = createContext(null);

function notificationIcon(type) {
  if (type?.startsWith('task_')) return 'fa-tasks';
  if (type?.startsWith('meeting_')) return 'fa-calendar';
  if (type?.startsWith('item_')) return 'fa-clipboard';
  return 'fa-bell';
}

// ─── AUTO-GENERATE NOTIFICATIONS ────────────────
function buildAutoNotifications(tasks, meetings, items) {
  const list = [];
  const now = new Date();
  const STALE_DAYS = 5;
  const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000;

  // Tasks: overdue + due today + stale
  tasks.forEach(t => {
    if (t.done) return;
    if (t.dueDate && isOverdue(t.dueDate)) {
      list.push({
        id: `auto-task-overdue-${t.id}`,
        type: 'task_overdue',
        severity: 'critical',
        title: 'Task overdue',
        message: t.text,
        entity_type: 'task',
        entity_id: t.id,
        link: `/tasks?open=${t.id}`,
      });
    } else if (t.dueDate && isDueToday(t.dueDate)) {
      list.push({
        id: `auto-task-today-${t.id}`,
        type: 'task_due_today',
        severity: 'warning',
        title: 'Task due today',
        message: t.text,
        entity_type: 'task',
        entity_id: t.id,
        link: `/tasks?open=${t.id}`,
      });
    } else if (t.updatedAt && now.getTime() - t.updatedAt > STALE_MS) {
      list.push({
        id: `auto-task-stale-${t.id}`,
        type: 'task_stale',
        severity: 'info',
        title: 'Task no updates',
        message: `${t.text} — no update for ${STALE_DAYS}+ days`,
        entity_type: 'task',
        entity_id: t.id,
        link: `/tasks?open=${t.id}`,
      });
    }
  });

  // Meetings: today + upcoming 24h
  meetings.forEach(m => {
    if (m.completed || !m.date) return;
    const meetingDate = new Date(`${m.date}T${m.time || '00:00'}`);
    const diffHours = (meetingDate - now) / (1000 * 60 * 60);
    if (diffHours >= 0 && diffHours <= 24) {
      list.push({
        id: `auto-meeting-${m.id}`,
        type: 'meeting_upcoming',
        severity: 'info',
        title: 'Upcoming meeting',
        message: `${m.title} • ${m.time || 'TBD'}`,
        entity_type: 'meeting',
        entity_id: m.id,
        link: `/meetings?open=${m.id}`,
      });
    }
  });

  // Items: overdue check-in + stale
  items.forEach(i => {
    if (i.status === 'completed' || i.status === 'cancelled') return;
    if (!i.nextCheck) return;
    const next = new Date(i.nextCheck + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      list.push({
        id: `auto-item-overdue-${i.id}`,
        type: 'item_overdue',
        severity: 'critical',
        title: 'Check-in overdue',
        message: i.text || 'Untitled item',
        entity_type: 'item',
        entity_id: i.id,
        link: `/items?open=${i.id}`,
      });
    }
  });

  return list.map(n => ({ ...n, timestamp: now.getTime() }));
}

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const { tasks, meetings, items } = useAppData();

  const [dbNotifications, setDbNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const userId = currentUser?.id;
  const requestSequence = useRef(0);
  const activeUser = useRef(userId);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const request = ++requestSequence.current;
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('notifications').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(50);
      if (fetchError) throw fetchError;
      if (activeUser.current !== userId || request !== requestSequence.current) return;
      setDbNotifications(data || []);
      setError(null);
    } catch (err) {
      if (activeUser.current === userId && request === requestSequence.current) setError(err.message || 'Could not load notifications.');
    } finally {
      if (activeUser.current === userId && request === requestSequence.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    activeUser.current = userId;
    requestSequence.current += 1;
    // Reset account-scoped state when the external auth identity changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDbNotifications([]);
    setReadIds(new Set());
    setDismissedIds(new Set());
    setError(null);
    setLoading(Boolean(userId));
    if (!userId) return;
    let alive = true;
    const refresh = () => { if (alive) fetchNotifications(); };
    // Fetch after subscription and on reconnect so the initial fetch cannot miss an insert.
    const channel = supabase.channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, refresh)
      .subscribe(status => {
        if (!alive) return;
        if (status === 'SUBSCRIBED') refresh();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError('Live updates disconnected. Retry or reopen the page.');
        }
      });
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      alive = false;
      window.removeEventListener('focus', onFocus);
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  // DB rows are the authority for persisted flags, including changes from other tabs.
  const effectiveReadIds = useMemo(() => new Set([
    ...readIds, ...dbNotifications.filter(n => n.read).map(n => n.id),
  ]), [readIds, dbNotifications]);
  const effectiveDismissedIds = useMemo(() => new Set([
    ...dismissedIds, ...dbNotifications.filter(n => n.dismissed).map(n => n.id),
  ]), [dismissedIds, dbNotifications]);

  // ─── COMBINE AUTO + DB NOTIFICATIONS ────────────
  const autoNotifications = useMemo(
    () => buildAutoNotifications(tasks, meetings, items),
    [tasks, meetings, items]
  );

  const notifications = useMemo(() => {
    // Combine DB notifications + auto-generated
    const combined = [
      ...dbNotifications.map(n => ({
        id: n.id,
        type: n.type,
        severity: n.severity,
        title: n.title,
        message: n.message,
        entityType: n.entity_type,
        entityId: n.entity_id,
        path: n.link,
        timestamp: new Date(n.created_at).getTime(),
        fromDb: true,
        senderId: n.sender_id,
        icon: notificationIcon(n.type),
      })),
      ...autoNotifications.map(n => ({
        ...n,
        path: n.link,
        entityType: n.entity_type,
        entityId: n.entity_id,
        timestamp: n.timestamp,
        fromDb: false,
        icon: notificationIcon(n.type),
      })),
    ];

    // Filter dismissed
    const filtered = combined.filter(n => !effectiveDismissedIds.has(n.id));

    // Sort by timestamp
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [dbNotifications, autoNotifications, effectiveDismissedIds]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !effectiveReadIds.has(n.id)).length,
    [notifications, effectiveReadIds]
  );

  const updateFlags = useCallback(async (ids, field) => {
    const owner = userId;
    if (!owner) return false;
    const dbIds = ids.filter(id => dbNotifications.some(n => n.id === id));
    try {
      if (dbIds.length) {
        const { data, error: updateError } = await supabase.from('notifications')
          .update({ [field]: true }).eq('user_id', owner).in('id', dbIds).select('id');
        if (updateError) throw updateError;
        if (data?.length !== dbIds.length) throw new Error('Some notifications could not be updated. Please retry.');
      }
      if (activeUser.current !== owner) return false;
      setDbNotifications(prev => prev.map(n => dbIds.includes(n.id) ? { ...n, [field]: true } : n));
      const localIds = ids.filter(id => !dbIds.includes(id));
      const setter = field === 'read' ? setReadIds : setDismissedIds;
      setter(prev => new Set([...prev, ...localIds]));
      setError(null);
      return true;
    } catch (err) {
      if (activeUser.current === owner) {
        setError(err.message || 'Could not save notification changes.');
      }
      return false;
    }
  }, [userId, dbNotifications]);

  const markAsRead = useCallback(id => updateFlags([id], 'read'), [updateFlags]);
  const markAllAsRead = useCallback(() => updateFlags(notifications.map(n => n.id), 'read'), [updateFlags, notifications]);
  const dismiss = useCallback(id => updateFlags([id], 'dismissed'), [updateFlags]);
  const dismissAll = useCallback(() => updateFlags(notifications.map(n => n.id), 'dismissed'), [updateFlags, notifications]);

  // ─── SEND MANUAL NOTIFICATION (Head → Employee) ─
  const sendNotification = useCallback(async ({ userId, title, message, type = 'manual', severity = 'info', link = null }) => {
    if (!currentUser) return null;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          sender_id: currentUser.id,
          type,
          severity,
          title: title.trim(),
          message: message.trim(),
          link,
        });
      
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('❌ sendNotification error:', err);
      return null;
    }
  }, [currentUser]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      readIds: effectiveReadIds,
      dismissedIds: effectiveDismissedIds,
      error,
      loading,
      markAsRead,
      markAllAsRead,
      dismiss,
      dismissAll,
      sendNotification,
      refetch: fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

// Context hook intentionally lives beside its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
