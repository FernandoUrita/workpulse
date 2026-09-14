import { escapeHtml, formatDate, formatDateTime, getTargetDateStatus } from '../../utils/helpers.js';
import { ITEM_TYPE_CONFIG, ITEM_STATUS_LABELS, ITEM_PRIORITY_LABELS } from '../../utils/constants.js';

export default function ItemDetailModal({ show, item, onClose, onEdit, onDelete, onCheckin }) {
  if (!show || !item) return null;

  const typeConfig = ITEM_TYPE_CONFIG[item.type] || ITEM_TYPE_CONFIG.custom;
  const statusConfig = ITEM_STATUS_LABELS[item.status] || ITEM_STATUS_LABELS.pending;
  const priorityConfig = ITEM_PRIORITY_LABELS[item.priority] || ITEM_PRIORITY_LABELS.medium;

  let metaItems = [];
  if (item.ref) metaItems.push({ label: 'Reference', value: item.ref });
  if (item.nextCheck) metaItems.push({ label: 'Next Check-in', value: `📅 ${formatDate(item.nextCheck, { weekday: 'short', month: 'short' })}` });
  if (item.endDate) metaItems.push({ label: 'Target End', value: `📅 ${formatDate(item.endDate, { weekday: 'short', month: 'short' })}` });
  if (item.severity) metaItems.push({ label: 'Severity', value: item.severity.toUpperCase() });
  if (item.reporter) metaItems.push({ label: 'Reported By', value: item.reporter });
  if (item.client) metaItems.push({ label: 'Client', value: `🏢 ${item.client}` });
  if (item.requestedBy) metaItems.push({ label: 'Requested By', value: `👤 ${item.requestedBy}` });
  if (item.targetDate) {
    const status = getTargetDateStatus(item.targetDate, item.status);
    metaItems.push({
      label: 'Target Date',
      value: `📅 ${formatDate(item.targetDate, { weekday: 'short', month: 'short' })}`,
      color: status?.color,
      note: status?.note,
    });
  }
  if (item.createdAt) metaItems.push({ label: 'Created', value: formatDate(new Date(item.createdAt).toISOString().slice(0, 10), { month: 'long' }) });
  if (item.lastCheck) metaItems.push({ label: 'Last Check-in', value: formatDateTime(item.lastCheck) });

  return (
    <div className="modal show item-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3><i className="fas fa-cube"></i> Item Details</h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="item-detail-header">
            <div 
              className="item-detail-icon" 
              style={{ 
                background: `${typeConfig.color}20`, 
                color: typeConfig.color 
              }}
            >
              <i className={`fas ${typeConfig.icon}`}></i>
            </div>
            <div style={{ flex: 1 }}>
              <div className="item-detail-title">{escapeHtml(item.text)}</div>
              <div className="item-card-badges">
                <span className={`item-badge ${statusConfig.class}`}>
                  <i className={`fas ${statusConfig.icon}`}></i> {statusConfig.label}
                </span>
                <span className={`item-badge priority-${item.priority || 'medium'}`}>
                  {priorityConfig.emoji} {priorityConfig.label}
                </span>
                <span className="item-badge status-closed" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>
                  {typeConfig.label}
                </span>
              </div>
            </div>
          </div>

          <div className="item-detail-body">
            {item.notes && (
              <div className="item-detail-section">
                <h5><i className="fas fa-align-left"></i> Notes</h5>
                <p>{escapeHtml(item.notes)}</p>
              </div>
            )}

            {metaItems.length > 0 && (
              <div className="item-detail-section">
                <h5><i className="fas fa-info-circle"></i> Details</h5>
                <div className="item-detail-meta-grid">
                  {metaItems.map((m, i) => (
                    <div key={i} className="item-detail-meta-item">
                      <span className="label">{m.label}</span>
                      <span className="value" style={{ color: m.color || 'inherit' }}>
                        {m.value}{m.note}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.type === 'project' && (
              <div className="item-detail-section">
                <h5><i className="fas fa-chart-line"></i> Progress ({item.progress || 0}%)</h5>
                <div className="item-card-progress" style={{ height: '8px' }}>
                  <div className="item-card-progress-fill" style={{ width: `${item.progress || 0}%` }}></div>
                </div>
              </div>
            )}

            {item.type === 'custom' && item.link && (
              <div className="item-detail-section">
                <h5><i className="fas fa-link"></i> Link</h5>
                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
                >
                  🔗 Open Link
                </a>
              </div>
            )}

            {item.tags && item.tags.length > 0 && (
              <div className="item-detail-section">
                <h5><i className="fas fa-tags"></i> Tags</h5>
                <div className="item-card-tags">
                  {item.tags.map(t => (
                    <span key={t} className="item-tag">#{escapeHtml(t)}</span>
                  ))}
                </div>
              </div>
            )}

            {item.type === 'monitoring' && (
              <div className="item-detail-section">
                <h5><i className="fas fa-history"></i> Check-in Log ({item.checkinLog?.length || 0})</h5>
                {item.checkinLog && item.checkinLog.length > 0 ? (
                  <div className="checkin-log">
                    {[...item.checkinLog].sort((a, b) => b.time - a.time).map((log, i) => (
                      <div key={i} className="checkin-item">
                        <div className="checkin-time">{formatDateTime(log.time)}</div>
                        <div className="checkin-note">{escapeHtml(log.note || '(no note)')}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                    No check-ins yet. Click "Check-in" to log your first one.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {item.type === 'monitoring' && (
            <button className="secondary-btn" onClick={() => onCheckin(item)}>
              <i className="fas fa-clipboard-check"></i> Check-in
            </button>
          )}
          <button className="secondary-btn" onClick={() => onEdit(item)}>
            <i className="fas fa-edit"></i> Edit
          </button>
          <button className="danger-btn" onClick={() => onDelete(item)}>
            <i className="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
