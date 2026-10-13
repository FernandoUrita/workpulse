import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useAppData } from '../../context/AppDataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import TicketKanbanColumn from './TicketKanbanColumn.jsx';
import TicketKanbanCard from './TicketKanbanCard.jsx';

const COLUMNS = ['Open', 'In Progress', 'Closed'];

export default function TicketKanbanBoard({ tickets, onView }) {
  const { moveTicketToColumn } = useAppData();
  const { showToast } = useToast();
  const [activeTicket, setActiveTicket] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const grouped = useMemo(() => {
    const groups = { 'Open': [], 'In Progress': [], 'Closed': [] };
    tickets.forEach(t => {
      const status = t.status || 'Open';
      if (groups[status]) groups[status].push(t);
      else groups['Open'].push(t);
    });
    return groups;
  }, [tickets]);

  const findColumnOfTicket = (ticketId) => {
    for (const col of COLUMNS) {
      if (grouped[col].some(t => t.id === ticketId)) return col;
    }
    return null;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const ticket = tickets.find(t => t.id === active.id);
    setActiveTicket(ticket);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeColumn = findColumnOfTicket(active.id);
    const overColumn = COLUMNS.includes(over.id)
      ? over.id
      : findColumnOfTicket(over.id);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    moveTicketToColumn(active.id, overColumn);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) return;

    const ticket = tickets.find(t => t.id === active.id);
    const newColumn = COLUMNS.includes(over.id)
      ? over.id
      : findColumnOfTicket(over.id);

    if (ticket && newColumn && ticket.status !== newColumn) {
      showToast(
        'success',
        'Ticket Moved',
        `#${ticket.ticketNo} → ${newColumn}`
      );
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {COLUMNS.map(col => (
          <TicketKanbanColumn
            key={col}
            columnId={col}
            tickets={grouped[col]}
            onView={onView}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTicket ? (
          <div style={{ transform: 'rotate(3deg)', cursor: 'grabbing' }}>
            <TicketKanbanCard ticket={activeTicket} onView={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
