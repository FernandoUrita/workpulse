import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { escapeHtml } from '../../utils/helpers.js';
import { computeAging, getPriorityClass } from '../../utils/ticketHelpers.js';

export default function TicketKanbanCard({ ticket, onView }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id, data: { ticket } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const priorityClass = getPriorityClass(ticket.priority);
  const aging = computeAging(ticket.dateCreated);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ticket-kanban-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="kanban-card-header">
        <div className="ticket-kanban-no">
          <i className="fas fa-ticket-alt"></i>
          #{ticket.ticketNo || '—'}
        </div>
        <span className={`ticket-badge ${priorityClass}`}>
          {ticket.priority === 'Critical' && '🚨'}
          {ticket.priority === 'High' && '🔴'}
          {ticket.priority === 'Medium' && '🟡'}
          {ticket.priority === 'Low' && '🟢'}
        </span>
      </div>

      <div
        className="kanban-card-title"
        onClick={(e) => { e.stopPropagation(); onView(ticket); }}
      >
        {escapeHtml(ticket.subject || ticket.remarks || 'No subject')}
      </div>

      <div className="ticket-kanban-client">
        <i className="fas fa-building"></i>
        {escapeHtml(ticket.clientName || 'No client')}
      </div>

      <div className="kanban-card-meta">
        {aging && (
          <span className={`ticket-aging aging-${aging.toLowerCase().replace(/\s+/g, '-')}`}>
            <i className="fas fa-hourglass-half"></i> {aging}
          </span>
        )}
        <span>
          <i className="fas fa-user-tie"></i> {ticket.pendingTo || 'Client'}
        </span>
      </div>
    </div>
  );
}
