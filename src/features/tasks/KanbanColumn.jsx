import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard.jsx';

const COLUMN_META = {
  todo:          { label: 'To Do',       icon: 'fa-circle',       color: 'blue' },
  'in-progress': { label: 'In Progress', icon: 'fa-spinner',      color: 'yellow' },
  done:          { label: 'Done',        icon: 'fa-check-circle', color: 'green' },
};

export default function KanbanColumn({ columnId, tasks, onView }) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const meta = COLUMN_META[columnId] || { label: columnId, icon: 'fa-circle', color: 'gray' };

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'over' : ''} column-${columnId}`}
    >
      <div className="kanban-column-header">
        <div className={`kanban-column-title color-${meta.color}`}>
          <i className={`fas ${meta.icon}`}></i>
          <span>{meta.label}</span>
        </div>
        <span className="kanban-column-count">{tasks.length}</span>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-column-body">
          {tasks.length === 0 ? (
            <div className="kanban-column-empty">
              <i className="fas fa-inbox"></i>
              <span>No tasks</span>
            </div>
          ) : (
            tasks.map(task => (
              <KanbanCard key={task.id} task={task} onView={onView} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
