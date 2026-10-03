import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TicketKanbanCard from './TicketKanbanCard.jsx';

const COLUMN_META = {
  'Open':        { icon: 'fa-folder-open',  color: 'green' },
  'In Progress': { icon: 'fa-spinner',      color: 'yellow' },
  'Closed':      { icon: 'fa-check-circle', color: 'purple' },
};

export default function TicketKanbanColumn({ columnId, tickets, onView }) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const meta = COLUMN_META[columnId] || { icon: 'fa-circle', color: 'gray' };

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ticket-kanban-column ${isOver ? 'over' : ''}`}
    >
      <div className="kanban-column-header">
        <div className={`kanban-column-title color-${meta.color}`}>
          <i className={`fas ${meta.icon}`}></i>
          <span>{columnId}</span>
        </div>
        <span className="kanban-column-count">{tickets.length}</span>
      </div>

      <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-column-body">
          {tickets.length === 0 ? (
            <div className="kanban-column-empty">
              <i className="fas fa-inbox"></i>
              <span>No tickets</span>
            </div>
          ) : (
            tickets.map(ticket => (
              <TicketKanbanCard key={ticket.id} ticket={ticket} onView={onView} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
