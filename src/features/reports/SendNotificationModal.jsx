import { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const TEMPLATES = [
  {
    id: 'overdue',
    label: 'Overdue Items',
    icon: 'fa-exclamation-triangle',
    severity: 'critical',
    title: 'Overdue items need your attention',
    message: 'You have overdue tasks/items. Please update or complete them as soon as possible.',
  },
  {
    id: 'stale',
    label: 'No Recent Updates',
    icon: 'fa-clock',
    severity: 'warning',
    title: 'Items with no recent updates',
    message: 'Some of your items have no updates for 5+ days. Please provide a status update.',
  },
  {
    id: 'pending',
    label: 'Pending Reminder',
    icon: 'fa-hourglass-half',
    severity: 'info',
    title: 'Pending items reminder',
    message: 'You have pending items waiting for your action. Please review them.',
  },
  {
    id: 'custom',
    label: 'Custom Message',
    icon: 'fa-pen',
    severity: 'info',
    title: '',
    message: '',
  },
];

const SEVERITIES = [
  { value: 'info', label: 'Info', icon: 'fa-info-circle', color: '#3b82f6' },
  { value: 'warning', label: 'Warning', icon: 'fa-exclamation-triangle', color: '#f59e0b' },
  { value: 'critical', label: 'Critical', icon: 'fa-exclamation-circle', color: '#ef4444' },
];

export default function SendNotificationModal({ show, recipient, onClose }) {
  const { sendNotification } = useNotifications();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [selectedTemplate, setSelectedTemplate] = useState('overdue');
  const [title, setTitle] = useState(TEMPLATES[0].title);
  const [message, setMessage] = useState(TEMPLATES[0].message);
  const [severity, setSeverity] = useState(TEMPLATES[0].severity);
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);

  if (!show || !recipient) return null;

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (tpl && templateId !== 'custom') {
      setTitle(tpl.title);
      setMessage(tpl.message);
      setSeverity(tpl.severity);
    } else {
      setTitle('');
      setMessage('');
      setSeverity('info');
    }
  };

  const handleSend = async () => {
    if (!title.trim()) {
      showToast('warning', 'Missing Title', 'Please enter a notification title.');
      return;
    }
    if (!message.trim()) {
      showToast('warning', 'Missing Message', 'Please enter a message.');
      return;
    }

    setSending(true);
    const result = await sendNotification({
      userId: recipient.id,
      title: title.trim(),
      message: message.trim(),
      type: `manual_${selectedTemplate}`,
      severity,
      link: link.trim() || null,
    });
    setSending(false);

    if (result) {
      showToast(
        'success',
        'Reminder Sent',
        `Notification sent to ${recipient.name || recipient.username}.`
      );
      handleClose();
    } else {
      showToast('error', 'Send Failed', 'Could not send notification. Please try again.');
    }
  };

  const handleClose = () => {
    setSelectedTemplate('overdue');
    setTitle(TEMPLATES[0].title);
    setMessage(TEMPLATES[0].message);
    setSeverity(TEMPLATES[0].severity);
    setLink('');
    onClose();
  };

  return (
    <div className="modal show" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal-content" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-paper-plane"></i> Send Notification
          </h3>
          <button className="close-modal" onClick={handleClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Recipient info */}
          <div className="send-recipient">
            <i className="fas fa-user-circle"></i>
            <div>
              <strong>{recipient.name || recipient.username}</strong>
              <span>@{recipient.username} • {recipient.role}</span>
            </div>
          </div>

          {/* Templates */}
          <div className="form-group full-width">
            <label><i className="fas fa-layer-group"></i> Template</label>
            <div className="template-grid">
              {TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  type="button"
                  className={`template-btn ${selectedTemplate === tpl.id ? 'active' : ''}`}
                  onClick={() => handleTemplateChange(tpl.id)}
                >
                  <i className={`fas ${tpl.icon}`}></i>
                  <span>{tpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="form-group full-width">
            <label><i className="fas fa-heading"></i> Title <span className="required">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              maxLength={100}
              disabled={sending}
            />
          </div>

          {/* Message */}
          <div className="form-group full-width">
            <label><i className="fas fa-comment-alt"></i> Message <span className="required">*</span></label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message..."
              rows={4}
              maxLength={500}
              disabled={sending}
            />
            <span className="char-count">{message.length}/500</span>
          </div>

          {/* Severity */}
          <div className="form-group full-width">
            <label><i className="fas fa-flag"></i> Severity</label>
            <div className="severity-selector">
              {SEVERITIES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  className={`severity-btn ${severity === s.value ? 'active' : ''}`}
                  style={{ '--sev-color': s.color }}
                  onClick={() => setSeverity(s.value)}
                  disabled={sending}
                >
                  <i className={`fas ${s.icon}`} style={{ color: s.color }}></i>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Link (optional) */}
          <div className="form-group full-width">
            <label><i className="fas fa-link"></i> Link (optional)</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g., /tasks or /tickets"
              maxLength={200}
              disabled={sending}
            />
            <small className="label-hint">Leave empty for no link.</small>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={handleClose} disabled={sending}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSend} disabled={sending}>
            {sending ? (
              <><i className="fas fa-spinner fa-spin"></i> Sending...</>
            ) : (
              <><i className="fas fa-paper-plane"></i> Send Notification</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
