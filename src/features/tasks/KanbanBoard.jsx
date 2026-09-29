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
import KanbanColumn from './KanbanColumn.jsx';
import KanbanCard from './KanbanCard.jsx';

const COLUMNS = ['todo', 'in-progress', 'done'];

export default function KanbanBoard({ tasks, onView }) {
  const { moveTaskToColumn } = useAppData();
  const { showToast } = useToast();
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Group tasks by kanbanStatus
  const grouped = useMemo(() => {
    const groups = { todo: [], 'in-progress': [], done: [] };
    tasks.forEach(t => {
      const status = t.kanbanStatus || (t.done ? 'done' : 'todo');
      if (groups[status]) groups[status].push(t);
      else groups.todo.push(t);
    });
    return groups;
  }, [tasks]);

  const findColumnOfTask = (taskId) => {
    for (const col of COLUMNS) {
      if (grouped[col].some(t => t.id === taskId)) return col;
    }
    return null;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeColumn = findColumnOfTask(active.id);
    const overColumn = COLUMNS.includes(over.id)
      ? over.id
      : findColumnOfTask(over.id);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    // Move task to new column on drag over
    moveTaskToColumn(active.id, overColumn);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const task = tasks.find(t => t.id === active.id);
    const newColumn = COLUMNS.includes(over.id)
      ? over.id
      : findColumnOfTask(over.id);

    if (task && newColumn && task.kanbanStatus !== newColumn) {
      showToast(
        'success',
        'Task Moved',
        `"${task.text}" → ${newColumn === 'done' ? 'Done' : newColumn === 'in-progress' ? 'In Progress' : 'To Do'}`
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
          <KanbanColumn
            key={col}
            columnId={col}
            tasks={grouped[col]}
            onView={onView}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div style={{ transform: 'rotate(3deg)', cursor: 'grabbing' }}>
            <KanbanCard task={activeTask} onView={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
