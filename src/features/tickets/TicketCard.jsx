import { escapeHtml, formatDate } from '../../utils/helpers.js';
import { computeAging, getStatusClass, getPriorityClass } from '../../utils/ticketHelpers.js';

export default function TicketCard({ ticket, onView, onEdit, onDelete }) {
  const aging = computeAging(ticket.dateCreated);
  const statusClass = getStatusClass(ticket.status);
  const priorityClass = getPriorityClass(ticket.priority);

  return (
    <div className="ticket-card">
      <div className="ticket-card-header">
        <div className="ticket-card-no">
          <i className="fas fa-ticket-alt"></i>
          <span>#{ticket.ticketNo || '—'}</span>
        </div>
        <div className="ticket-card-badges">
          <span className={`ticket-badge ${statusClass}`}>{ticket.status}</span>
          <span className={`ticket-badge ${priorityClass}`}>
            {ticket.priority === 'Critical' && '🚨'}
            {ticket.priority === 'High' && '🔴'}
            {ticket.priority === 'Medium' && '🟡'}
            {ticket.priority === 'Low' && '🟢'}
            {' '}{ticket.priority}
          </span>
        </div>
      </div>

      <div className="ticket-card-body">
        <div className="ticket-card-client">
          <i className="fas fa-building"></i>
          <strong>{escapeHtml(ticket.clientName || 'No client')}</strong>
        </div>

        <div
          className="ticket-card-subject"
          onClick={() => onView(ticket)}
        >
          {escapeHtml(ticket.subject || ticket.remarks || 'No subject')}
        </div>

        {ticket.remarks && ticket.subject && (
          <div className="ticket-card-remarks">{escapeHtml(ticket.remarks)}</div>
        )}
      </div>

      <div className="ticket-card-meta">
        {aging && (
          <span className={`ticket-aging aging-${aging.toLowerCase().replace(/\s+/g, '-')}`}>
            <i className="fas fa-hourglass-half"></i>
            {aging}
          </span>
        )}
        <span>
          <i className="fas fa-user-tie"></i>
          {ticket.pendingTo || 'Client'}
        </span>
        {ticket.category && (
          <span>
            <i className="fas fa-tag"></i>
            {ticket.category}
          </span>
        )}
        {ticket.timeline && (
          <span>
            <i className="fas fa-calendar-day"></i>
            {formatDate(ticket.timeline)}
          </span>
        )}
      </div>

      <div className="ticket-card-actions">
        <button className="action-view" onClick={() => onView(ticket)}>
          <i className="fas fa-eye"></i> View
        </button>
        <button className="action-edit" onClick={() => onEdit(ticket)}>
          <i className="fas fa-edit"></i> Edit
        </button>
        <button className="action-delete" onClick={() => onDelete(ticket)}>
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
}
