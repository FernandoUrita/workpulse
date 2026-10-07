import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

<<<<<<< HEAD
const TEMPLATES = {
  overdue: { label: 'Overdue Items', title: 'Overdue items need your attention', message: 'You have overdue tasks/items. Please update or complete them as soon as possible.', severity: 'critical' },
  stale: { label: 'No Recent Updates', title: 'Please update your work items', message: 'Please review your tasks and items and provide your latest progress update.', severity: 'warning' },
  pending: { label: 'Pending Reminder', title: 'Reminder: pending work items', message: 'Please review your pending tasks and update their status when available.', severity: 'info' },
  custom: { label: 'Custom Message', title: '', message: '', severity: 'info' },
};

export default function SendNotificationModal({ onClose, recipient = null }) {
  const { currentUser } = useAuth();
  const { sendNotification } = useNotifications();
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState({ userId: recipient?.id || '', title: '', message: '', severity: 'info', link: '/dashboard' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!recipient);
=======
export default function SendNotificationModal({ onClose }) {
  const { currentUser } = useAuth();
  const { sendNotification } = useNotifications();
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState({ userId: '', title: '', message: '', severity: 'info', link: '/dashboard' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
>>>>>>> 7fa8eda8de3473a0d88b77a070408e58fdf66ccd
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const dialog = useRef(null);
  useEffect(() => {
    let alive = true;
    const previous = document.activeElement;
    dialog.current?.focus();
<<<<<<< HEAD
    if (recipient) {
      return () => { alive = false; previous?.focus(); };
    }
=======
>>>>>>> 7fa8eda8de3473a0d88b77a070408e58fdf66ccd
    supabase.from('profiles').select('id,name,username,role').order('name').then(({ data, error }) => {
      if (!alive) return;
      setProfiles(data || []); setError(error?.message || ''); setLoading(false);
    });
    return () => { alive = false; previous?.focus(); };
<<<<<<< HEAD
  }, [recipient]);
=======
  }, []);
>>>>>>> 7fa8eda8de3473a0d88b77a070408e58fdf66ccd
  if (!['head', 'admin'].includes(currentUser?.role)) return null;
  const submit = async e => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    const result = await sendNotification(form);
    setBusy(false);
    if (result) setSent(true);
    else setError('Could not send. Check your connection and notification permissions, then retry.');
  };
  const change = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  return <div className="modal show" onClick={e => { if (e.target === e.currentTarget && !busy) onClose(); }}>
    <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="send-notification-title" ref={dialog} tabIndex={-1} onKeyDown={e => {
      if (e.key === 'Escape' && !busy) onClose();
      if (e.key === 'Tab') {
        const nodes = [...dialog.current.querySelectorAll('button,input,select,textarea')].filter(n => !n.disabled);
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }}>
      <div className="modal-header"><h3 id="send-notification-title">Send reminder</h3><button className="close-modal" disabled={busy} onClick={onClose} aria-label="Close">×</button></div>
      {sent ? <div className="modal-body"><p role="status">Reminder sent successfully.</p><button className="btn btn-primary" onClick={onClose}>Done</button></div> : <form onSubmit={submit}>
        <div className="modal-body"><div className="form-grid">
<<<<<<< HEAD
          {recipient ? <div className="form-group full-width"><strong>{recipient.name || recipient.username}</strong><span>{recipient.role}</span></div> : <div className="form-group full-width"><label htmlFor="notif-recipient">Recipient</label><select id="notif-recipient" name="userId" value={form.userId} onChange={change} required disabled={loading || busy}><option value="">{loading ? 'Loading people…' : 'Select a person'}</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.name || p.username} ({p.role})</option>)}</select></div>}
          <div className="form-group full-width"><label>Template</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{Object.entries(TEMPLATES).map(([id, template]) => <button key={id} type="button" className="btn" disabled={busy} onClick={() => setForm(prev => ({ ...prev, title: template.title, message: template.message, severity: template.severity }))}>{template.label}</button>)}</div></div>
=======
          <div className="form-group full-width"><label htmlFor="notif-recipient">Recipient</label><select id="notif-recipient" name="userId" value={form.userId} onChange={change} required disabled={loading || busy}><option value="">{loading ? 'Loading people…' : 'Select a person'}</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.name || p.username} ({p.role})</option>)}</select></div>
>>>>>>> 7fa8eda8de3473a0d88b77a070408e58fdf66ccd
          <div className="form-group full-width"><label htmlFor="notif-title">Title</label><input id="notif-title" name="title" value={form.title} onChange={change} required maxLength={120} disabled={busy} /></div>
          <div className="form-group full-width"><label htmlFor="notif-message">Message</label><textarea id="notif-message" name="message" value={form.message} onChange={change} required maxLength={2000} rows={4} disabled={busy} /></div>
          <div className="form-group"><label htmlFor="notif-severity">Priority</label><select id="notif-severity" name="severity" value={form.severity} onChange={change} disabled={busy}><option value="info">Normal</option><option value="warning">Important</option><option value="critical">Urgent</option></select></div>
          <div className="form-group"><label htmlFor="notif-link">Open page</label><select id="notif-link" name="link" value={form.link} onChange={change} disabled={busy}>{['dashboard','tasks','tickets','meetings','items'].map(p => <option key={p} value={'/'+p}>{p}</option>)}</select></div>
        </div>{error && <p role="alert">{error}</p>}</div>
<<<<<<< HEAD
        <div className="modal-footer"><button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button><button className="btn btn-primary" type="submit" disabled={busy || loading || (!recipient && !profiles.length)}>{busy ? 'Sending…' : 'Send reminder'}</button></div>
=======
        <div className="modal-footer"><button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button><button className="btn btn-primary" type="submit" disabled={busy || loading || !profiles.length}>{busy ? 'Sending…' : 'Send reminder'}</button></div>
>>>>>>> 7fa8eda8de3473a0d88b77a070408e58fdf66ccd
      </form>}
    </div>
  </div>;
}
