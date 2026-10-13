import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { escapeHtml, isOverdue, isDueToday, formatDate } from '../../utils/helpers.js';
import { TASK_PRIORITY_LABELS, TASK_CATEGORY_LABELS } from '../../utils/constants.js';

export default function KanbanCard({ task, onView }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const priority = TASK_PRIORITY_LABELS[task.priority] || TASK_PRIORITY_LABELS.medium;
  const category = TASK_CATEGORY_LABELS[task.category] || '';

  const dueState = !task.dueDate ? ''
    : task.done ? 'normal'
    : isOverdue(task.dueDate) ? 'overdue'
    : isDueToday(task.dueDate) ? 'today'
    : 'normal';

  const dueText = !task.dueDate ? ''
    : task.done ? formatDate(task.dueDate)
    : isOverdue(task.dueDate) ? `⚠️ ${formatDate(task.dueDate)}`
    : isDueToday(task.dueDate) ? 'Due Today'
    : formatDate(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card priority-${task.priority || 'medium'} ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="kanban-card-header">
        <div className={`kanban-card-priority ${task.priority || 'medium'}`}>
          {priority.emoji}
        </div>
        {category && <span className="kanban-card-category">{category}</span>}
      </div>

      <div
        className={`kanban-card-title ${task.done ? 'done' : ''}`}
        onClick={(e) => { e.stopPropagation(); onView(task); }}
      >
        {escapeHtml(task.text)}
      </div>

      {task.description && (
        <div className="kanban-card-desc">{escapeHtml(task.description)}</div>
      )}

      <div className="kanban-card-meta">
        {task.dueDate && (
          <span className={`kanban-card-due ${dueState}`}>
            📅 {dueText}
          </span>
        )}
        {Array.isArray(task.assignees) && task.assignees.length > 0 && (
          <span className="kanban-card-assignees">
            👤 {task.assignees.length}
          </span>
        )}
      </div>
    </div>
  );
}
