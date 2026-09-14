import { escapeHtml, isOverdue, isDueToday, formatDate, formatDateTime } from '../../utils/helpers.js';
import { TASK_PRIORITY_LABELS, TASK_CATEGORY_LABELS } from '../../utils/constants.js';

export default function TaskDetailModal({ task, onClose, onToggle, onEdit, onDelete }) {
  if (!task) return null;

  const priority = TASK_PRIORITY_LABELS[task.priority] || TASK_PRIORITY_LABELS.medium;
  const category = TASK_CATEGORY_LABELS[task.category] || '';

  let dueInfo = 'No due date';
  if (task.dueDate) {
    const formatted = formatDate(task.dueDate, { weekday: 'long', month: 'long' });
    if (task.done) dueInfo = `📅 ${formatted}`;
    else if (isOverdue(task.dueDate)) dueInfo = `⚠️ Overdue: ${formatted}`;
    else if (isDueToday(task.dueDate)) dueInfo = `📅 Due Today (${formatted})`;
    else dueInfo = `📅 ${formatted}`;
  }

  return (
    <div className="modal show task-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3><i className="fas fa-clipboard-check"></i> Task Details</h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="task-detail-header">
            <div 
              className={`task-detail-check ${task.done ? 'checked' : ''}`}
              onClick={() => onToggle(task.id)}
            >
              {task.done && '✓'}
            </div>
            <div className={`task-detail-title ${task.done ? 'done' : ''}`}>
              {escapeHtml(task.text)}
            </div>
          </div>

          <div className="task-detail-body">
            {task.description && (
              <div className="task-detail-section">
                <h5><i className="fas fa-align-left"></i> Description</h5>
                <p>{escapeHtml(task.description)}</p>
              </div>
            )}

            <div className="task-detail-section">
              <h5><i className="fas fa-info-circle"></i> Details</h5>
              <div className="task-detail-badges">
                <span className={`tag tag-${task.priority || 'medium'}`}>
                  {priority.emoji} {priority.label}
                </span>
                {category && <span className="tag tag-general">{category}</span>}
                {task.done 
                  ? <span className="tag tag-completed">✅ Completed</span>
                  : <span className="tag tag-medium">⏳ Pending</span>
                }
              </div>
            </div>

            <div className="task-detail-meta-grid">
              <div className="task-detail-meta-item">
                <span className="label">Due Date</span>
                <span className="value">{dueInfo}</span>
              </div>
              <div className="task-detail-meta-item">
                <span className="label">Assignee</span>
                <span className="value">{task.assignee ? `👤 ${escapeHtml(task.assignee)}` : '—'}</span>
              </div>
              <div className="task-detail-meta-item">
                <span className="label">Created</span>
                <span className="value">
                  {task.createdAt ? formatDate(new Date(task.createdAt).toISOString().slice(0,10), { month: 'long' }) : '—'}
                </span>
              </div>
              <div className="task-detail-meta-item">
                <span className="label">Last Updated</span>
                <span className="value">
                  {task.updatedAt ? formatDate(new Date(task.updatedAt).toISOString().slice(0,10), { month: 'long' }) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={() => onEdit(task)}>
            <i className="fas fa-edit"></i> Edit
          </button>
          <button className="danger-btn" onClick={() => onDelete(task)}>
            <i className="fas fa-trash"></i> Delete
          </button>
          <button className="primary-btn" onClick={() => onToggle(task.id)}>
            <i className={`fas fa-${task.done ? 'undo' : 'check'}`}></i>
            {task.done ? ' Mark Pending' : ' Mark Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}
