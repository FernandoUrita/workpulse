import { escapeHtml, formatDate, getCheckinStatus, getTargetDateStatus } from '../../utils/helpers.js';
import { ITEM_TYPE_CONFIG, ITEM_STATUS_LABELS, ITEM_PRIORITY_LABELS } from '../../utils/constants.js';

export default function ItemCard({ item, onView, onEdit, onDelete, onCheckin }) {
  const typeConfig = ITEM_TYPE_CONFIG[item.type] || ITEM_TYPE_CONFIG.custom;
  const statusConfig = ITEM_STATUS_LABELS[item.status] || ITEM_STATUS_LABELS.pending;
  const priorityConfig = ITEM_PRIORITY_LABELS[item.priority] || ITEM_PRIORITY_LABELS.medium;

  const checkinStatus = item.type === 'monitoring' && item.nextCheck 
    ? getCheckinStatus(item.nextCheck) 
    : null;

  let metaRows = [];
  if (item.type === 'monitoring' && item.nextCheck) {
    metaRows.push({
      icon: 'fa-calendar-check',
      label: 'Next check',
      value: formatDate(item.nextCheck)
    });
  }
  if (item.type === 'project' && item.endDate) {
    metaRows.push({
      icon: 'fa-calendar-xmark',
      label: 'Target end',
      value: formatDate(item.endDate)
    });
  }
  if (item.type === 'issue' && item.severity) {
    metaRows.push({
      icon: 'fa-triangle-exclamation',
      label: 'Severity',
      value: item.severity.toUpperCase()
    });
  }
  if (item.type === 'issue' && item.reporter) {
    metaRows.push({
      icon: 'fa-user-pen',
      label: 'Reported by',
      value: item.reporter
    });
  }
  if (item.type === 'custom' && item.client) {
    metaRows.push({
      icon: 'fa-building',
      label: 'Client',
      value: item.client
    });
  }
  if (item.type === 'custom' && item.requestedBy) {
    metaRows.push({
      icon: 'fa-user-tie',
      label: 'Requested by',
      value: item.requestedBy
    });
  }
  if (item.type === 'custom' && item.targetDate) {
    const status = getTargetDateStatus(item.targetDate, item.status);
    metaRows.push({
      icon: 'fa-calendar-day',
      label: 'Target',
      value: formatDate(item.targetDate),
      color: status?.color,
      note: status?.note
    });
  }
  if (item.lastCheck) {
    metaRows.push({
      icon: 'fa-history',
      label: 'Last check',
      value: formatDate(new Date(item.lastCheck).toISOString().slice(0, 10))
    });
  }

  return (
    <div className="item-card" data-type={item.type || 'custom'}>
      <div className="item-card-header">
        <div className="item-card-type-icon">
          <i className={`fas ${typeConfig.icon}`}></i>
        </div>
        <div className="item-card-title-wrapper">
          <div className="item-card-title" onClick={() => onView(item)}>
            {escapeHtml(item.text)}
          </div>
          {item.ref && (
            <div className="item-card-ref">
              <i className="fas fa-hashtag"></i> {escapeHtml(item.ref)}
            </div>
          )}
        </div>
      </div>

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

      {item.notes && (
        <div className="item-card-notes">{escapeHtml(item.notes)}</div>
      )}

      {checkinStatus && (
        <div className={`checkin-status ${checkinStatus.status}`}>
          <i className={`fas fa-${checkinStatus.status === 'ok' ? 'check-circle' : 'bell'}`}></i>
          {checkinStatus.label}
        </div>
      )}

      {item.type === 'project' && typeof item.progress === 'number' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span>Progress</span>
            <strong style={{ color: 'var(--primary)' }}>{item.progress}%</strong>
          </div>
          <div className="item-card-progress">
            <div className="item-card-progress-fill" style={{ width: `${item.progress}%` }}></div>
          </div>
        </div>
      )}

      {metaRows.length > 0 && (
        <div className="item-card-meta">
          {metaRows.map((row, i) => (
            <div key={i} className="meta-row">
              <i className={`fas ${row.icon}`}></i> {row.label}: {' '}
              <strong style={{ color: row.color || 'inherit' }}>
                {escapeHtml(row.value)}
                {row.note}
              </strong>
            </div>
          ))}
        </div>
      )}

      {item.type === 'custom' && item.link && (
        <div style={{ fontSize: '12px' }}>
          <i className="fas fa-link" style={{ color: 'var(--primary)', marginRight: '4px' }}></i>
          <a 
            href={item.link} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
          >
            Open Link
          </a>
        </div>
      )}

      {item.tags && item.tags.length > 0 && (
        <div className="item-card-tags">
          {item.tags.map(t => (
            <span key={t} className="item-tag">#{escapeHtml(t)}</span>
          ))}
        </div>
      )}

      <div className="item-card-actions">
        <button className="action-view" onClick={() => onView(item)}>
          <i className="fas fa-eye"></i>
        </button>
        {item.type === 'monitoring' && (
          <button className="action-checkin" onClick={() => onCheckin(item)}>
            <i className="fas fa-clipboard-check"></i> Check-in
          </button>
        )}
        <button className="action-edit" onClick={() => onEdit(item)}>
          <i className="fas fa-edit"></i>
        </button>
        <button className="action-delete" onClick={() => onDelete(item)}>
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
}
