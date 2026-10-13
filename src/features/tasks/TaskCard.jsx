import { escapeHtml, isOverdue, isDueToday, isDueSoon, formatDate } from '../../utils/helpers.js';
import { TASK_PRIORITY_LABELS, TASK_CATEGORY_LABELS } from '../../utils/constants.js';

export default function TaskCard({ task, onToggle, onView, onEdit, onDelete }) {
  const priority = TASK_PRIORITY_LABELS[task.priority] || TASK_PRIORITY_LABELS.medium;
  const category = TASK_CATEGORY_LABELS[task.category] || '';

  const dueState = !task.dueDate ? '' 
    : task.done ? 'normal'
    : isOverdue(task.dueDate) ? 'overdue'
    : isDueToday(task.dueDate) ? 'today'
    : isDueSoon(task.dueDate) ? 'upcoming'
    : 'normal';

  const dueText = !task.dueDate ? '' 
    : task.done ? `📅 ${formatDate(task.dueDate)}`
    : isOverdue(task.dueDate) ? `⚠️ Overdue: ${formatDate(task.dueDate)}`
    : isDueToday(task.dueDate) ? '📅 Due Today'
    : `📅 ${formatDate(task.dueDate)}`;

  return (
    <div className={`task-card priority-${task.priority || 'medium'} ${task.done ? 'completed' : ''} ${dueState === 'overdue' ? 'overdue' : ''}`}>
      <div className="task-card-inner">
        <div className="task-checkbox-wrapper">
          <div 
            className={`task-checkbox ${task.done ? 'checked' : ''}`}
            onClick={() => onToggle(task.id)}
          >
            {task.done && '✓'}
          </div>
        </div>
        <div className="task-card-content">
          <div className="task-card-header">
            <span 
              className={`task-card-title ${task.done ? 'done' : ''}`}
              onClick={() => onView(task)}
            >
              {escapeHtml(task.text)}
            </span>
            <div className="task-card-badges">
              <span className={`tag tag-${task.priority || 'medium'}`}>
                {priority.emoji} {priority.label}
              </span>
              {category && <span className="tag tag-general">{category}</span>}
              {task.done && <span className="tag tag-completed">✅ Done</span>}
            </div>
          </div>

          {task.description && (
            <div className="task-card-desc">{escapeHtml(task.description)}</div>
          )}

          <div className="task-card-meta">
            {task.dueDate && <span className={`due-date ${dueState}`}>{dueText}</span>}
            {task.assignee && <span>👤 {escapeHtml(task.assignee)}</span>}
            {task.createdAt && (
              <span>📅 Created {formatDate(new Date(task.createdAt).toISOString().slice(0,10))}</span>
            )}
          </div>

          <div className="task-card-actions">
            <button className="action-view" onClick={() => onView(task)}>
              <i className="fas fa-eye"></i> View
            </button>
            <button className="action-edit" onClick={() => onEdit(task)}>
              <i className="fas fa-edit"></i> Edit
            </button>
            <button className="action-complete" onClick={() => onToggle(task.id)}>
              <i className={`fas fa-${task.done ? 'undo' : 'check'}`}></i> {task.done ? 'Undo' : 'Complete'}
            </button>
            <button className="action-delete" onClick={() => onDelete(task)}>
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}