import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { escapeHtml, todayISO } from '../../utils/helpers.js';

const QUICK_NOTES = [
  { emoji: '✅', label: 'All OK', note: 'All systems operational ✅' },
  { emoji: '⚠️', label: 'Minor Issue', note: 'Minor issue detected, monitoring' },
  { emoji: '🚨', label: 'Critical', note: 'Critical issue, needs escalation 🚨' },
  { emoji: '📞', label: 'Follow-up', note: 'Follow-up needed' },
];

export default function CheckinModal({ show, item, onClose, onSave }) {
  const [note, setNote] = useState('');
  const [nextDate, setNextDate] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    if (show) {
      setNote('');
      // Default next check-in = tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setNextDate(tomorrow.toISOString().slice(0, 10));
    }
  }, [show]);

  if (!show || !item) return null;

  const handleQuickNote = (quickNote) => {
    setNote(note ? `${note} ${quickNote}` : quickNote);
  };

  const handleSave = () => {
    onSave(item.id, note.trim(), nextDate);
    showToast('success', 'Check-in Logged', `"${item.text}" check-in recorded.`);
  };

  return (
    <div className="modal show checkin-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3><i className="fas fa-clipboard-check"></i> Log Check-in</h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Logging check-in for: <strong>{escapeHtml(item.text)}</strong>
          </p>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label><i className="fas fa-comment"></i> Note / Observation</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What did you observe? Any issues?"
              style={{
                padding: '10px 14px',
                border: '1.5px solid var(--border)',
                borderRadius: '10px',
                fontSize: '14px',
                background: 'var(--bg)',
                color: 'var(--text)',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            <div className="checkin-quick-notes">
              {QUICK_NOTES.map(q => (
                <button
                  key={q.label}
                  type="button"
                  className="checkin-quick-note"
                  onClick={() => handleQuickNote(q.note)}
                >
                  {q.emoji} {q.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label><i className="fas fa-calendar-plus"></i> Next Check-in Date</label>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleSave}>
            <i className="fas fa-check"></i> Save Check-in
          </button>
        </div>
      </div>
    </div>
  );
}
