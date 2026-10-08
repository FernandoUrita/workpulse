import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';

export default function UrgentAttentionButton({ employee }) {
  const { currentUser } = useAuth();
  const { sendNotification } = useNotifications();
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const busy = useRef(false);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  if (!['head', 'admin'].includes(currentUser?.role)) return null;
  const send = async event => {
    event.stopPropagation();
    if (busy.current || !employee?.id || employee.is_active === false) return;
    busy.current = true; setSending(true); setStatus('');
    try {
      const result = await sendNotification({
        userId: employee.id, title: 'Urgent: Attention needed',
        message: 'Urgent: Your attention is needed. Please check your pending work and contact your head.',
        type: 'manual', reminderLevel: 'urgent', link: '/dashboard',
      });
      if (mounted.current) setStatus(result ? 'Sent. Click again to send another.' : 'Could not send. Check your connection and notification permissions.');
    } catch {
      if (mounted.current) setStatus('Could not send. Please try again.');
    } finally {
      busy.current = false;
      if (mounted.current) setSending(false);
    }
  };
  return <span className="urgent-attention-control" onClick={event => event.stopPropagation()}>
    <button type="button" className="urgent-attention-btn" disabled={sending || employee.is_active === false}
      aria-label={`Send urgent attention reminder to ${employee.name || employee.username}`}
      title="Send a new urgent reminder with the default message" onClick={send}>
      <i className={`fas ${sending ? 'fa-spinner fa-spin' : 'fa-bell'}`} aria-hidden="true" />
      {sending ? 'Sending…' : 'Urgent Attention'}
    </button>
    <small role="status">{status}</small>
  </span>;
}
