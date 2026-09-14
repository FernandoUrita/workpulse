import { escapeHtml, formatDate } from '../../utils/helpers.js';
import { PLATFORM_LABELS, PLATFORM_ICONS } from '../../utils/constants.js';

export default function MeetingCard({ meeting, onViewMom, onPrint, onEdit, onDelete }) {
  const platformLabel = PLATFORM_LABELS[meeting.platform] || meeting.platform || '';
  const platformIcon = PLATFORM_ICONS[meeting.platform] || '🔗';
  
  const isPast = meeting.date && new Date(`${meeting.date}T${meeting.time || '00:00'}`) < new Date();
  const isCompleted = meeting.completed || false;
  
  const typeLabel = meeting.type === 'remote' ? '💻 Remote' : '🏢 Physical';
  const typeClass = meeting.type === 'remote' ? 'remote' : 'physical';
  const statusLabel = isCompleted ? '✅ Completed' : (isPast ? '⏰ Past' : '📅 Upcoming');
  const statusClass = isCompleted ? 'completed' : 'pending';

  let credsDisplay = '';
  if (meeting.anydeskId) {
    credsDisplay = `AnyDesk: ${escapeHtml(meeting.anydeskId)}${meeting.anydeskPassword ? ' (PW: ' + escapeHtml(meeting.anydeskPassword) + ')' : ''}`;
  } else if (meeting.teamviewerId) {
    credsDisplay = `TeamViewer: ${escapeHtml(meeting.teamviewerId)}${meeting.teamviewerPassword ? ' (PW: ' + escapeHtml(meeting.teamviewerPassword) + ')' : ''}`;
  }

  return (
    <div className="meeting-card">
      <div className="meeting-header">
        <span className="meeting-title">{escapeHtml(meeting.title)}</span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span className={`meeting-type-badge ${typeClass}`}>{typeLabel}</span>
          <span className={`meeting-status ${statusClass}`}>{statusLabel}</span>
        </div>
      </div>

      <div className="meeting-details">
        <span>📅 {meeting.date || 'No date'}</span>
        <span>⏰ {meeting.time || 'No time'}</span>
        {meeting.platform && (
          <span>{platformIcon} {platformLabel}</span>
        )}
        {meeting.location && <span>📍 {escapeHtml(meeting.location)}</span>}
        {meeting.link && (
          <span>
            🔗 <a href={meeting.link} target="_blank" rel="noopener noreferrer">{escapeHtml(meeting.link)}</a>
          </span>
        )}
      </div>

      {credsDisplay && (
        <div className="meeting-details">
          <span>🔑 {credsDisplay}</span>
        </div>
      )}

      {meeting.attendees && meeting.attendees.length > 0 && (
        <div className="meeting-attendees">
          👥 {meeting.attendees.map((a, i) => (
            <span key={i} className="attendee-pill">{escapeHtml(a)}</span>
          ))}
        </div>
      )}

      {meeting.agenda && meeting.agenda.length > 0 && (
        <ul className="meeting-agenda">
          {meeting.agenda.map((a, i) => (
            <li key={i}>• {escapeHtml(a)}</li>
          ))}
        </ul>
      )}

      {meeting.mom && (
        <div className="meeting-mom">
          <strong>📝 MOM:</strong> {escapeHtml(meeting.mom.substring(0, 300))}
          {meeting.mom.length > 300 && '...'}
        </div>
      )}

      <div className="meeting-actions">
        {!isCompleted ? (
          <button 
            className="view-doc-btn" 
            onClick={() => onViewMom(meeting)}
            style={{ background: '#10b981', color: 'white' }}
          >
            <i className="fas fa-check-circle"></i> End Meeting & MOM
          </button>
        ) : (
          <button 
            className="view-doc-btn" 
            onClick={() => onViewMom(meeting)}
          >
            <i className="fas fa-file-alt"></i> View MOM
          </button>
        )}
        <button className="view-doc-btn" onClick={() => onPrint(meeting)}>
          <i className="fas fa-print"></i> Print
        </button>
        <button className="edit-btn" onClick={() => onEdit(meeting)}>✏️</button>
        <button className="delete-btn" onClick={() => onDelete(meeting)}>🗑️</button>
      </div>
    </div>
  );
}
