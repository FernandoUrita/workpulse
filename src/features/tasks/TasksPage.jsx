import { useState, useMemo } from 'react';
import { useAppData } from '../../context/AppDataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { 
  getDateFilteredTasks, 
  getTaskStats, 
  isOverdue,
  todayISO 
} from '../../utils/helpers.js';
import DateNavigator from './DateNavigator.jsx';
import TaskCard from './TaskCard.jsx';
import TaskModal from './TaskModal.jsx';
import TaskDetailModal from './TaskDetailModal.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import Pagination from '../../components/common/Pagination.jsx';

const PER_PAGE = 8;

export default function TasksPage() {
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    toggleTask, 
    bulkDeleteTasks, 
    bulkCompleteTasks 
  } = useAppData();
  const { showToast } = useToast();

  const [dateNav, setDateNav] = useState({ mode: 'today', activeDate: todayISO() });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(new Set());

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  const dateScoped = useMemo(() => 
    getDateFilteredTasks(tasks, dateNav.mode, dateNav.activeDate), 
    [tasks, dateNav]
  );

  const filtered = useMemo(() => {
    let result = dateScoped;

    if (filter === 'pending') result = result.filter(t => !t.done);
    else if (filter === 'completed') result = result.filter(t => t.done);
    else if (filter === 'overdue') result = result.filter(t => !t.done && t.dueDate && isOverdue(t.dueDate));
    else if (filter === 'high') result = result.filter(t => t.priority === 'high');
    else if (filter === 'medium') result = result.filter(t => t.priority === 'medium');
    else if (filter === 'low') result = result.filter(t => t.priority === 'low');

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(t =>
        t.text.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.assignee && t.assignee.toLowerCase().includes(q))
      );
    }

    if (category !== 'all') result = result.filter(t => t.category === category);

    return [...result].sort((a, b) => {
      if (sort === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sort === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sort === 'alpha') return a.text.localeCompare(b.text);
      if (sort === 'priority') {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.priority] || 1) - (order[b.priority] || 1);
      }
      if (sort === 'due') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return 0;
    });
  }, [dateScoped, filter, search, category, sort]);

  const stats = useMemo(() => getTaskStats(dateScoped), [dateScoped]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = Math.min(page, totalPages) || 1;
  const start = (currentPage - 1) * PER_PAGE;
  const paginated = filtered.slice(start, start + PER_PAGE);

  const handleAdd = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEdit = (task) => {
    setDetailTask(null);
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleSave = (data) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask(data);
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleToggle = (id) => {
    const task = tasks.find(t => t.id === id);
    toggleTask(id);
    if (task) {
      showToast(
        'success',
        task.done ? 'Task Reopened' : 'Task Completed',
        `"${task.text}" marked as ${task.done ? 'pending' : 'complete'}.`
      );
    }
    if (detailTask && detailTask.id === id) {
      setDetailTask(prev => ({ ...prev, done: !prev.done }));
    }
  };

  const handleDelete = (task) => {
    setDetailTask(null);
    setDeletingTask(task);
  };

  const confirmDelete = () => {
    if (deletingTask) {
      deleteTask(deletingTask.id);
      showToast('success', 'Task Deleted', `"${deletingTask.text}" has been removed.`);
      setDeletingTask(null);
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAllOnPage = (e) => {
    if (e.target.checked) {
      const next = new Set(selected);
      paginated.forEach(t => next.add(t.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      paginated.forEach(t => next.delete(t.id));
      setSelected(next);
    }
  };

  const clearSelection = () => setSelected(new Set());

  const handleBulkComplete = () => {
    bulkCompleteTasks(Array.from(selected));
    showToast('success', 'Tasks Completed', `${selected.size} tasks marked complete.`);
    clearSelection();
  };

  const handleBulkDelete = () => {
    const count = selected.size;
    bulkDeleteTasks(Array.from(selected));
    showToast('success', 'Tasks Deleted', `${count} tasks removed.`);
    clearSelection();
  };

  const allOnPageSelected = paginated.length > 0 && paginated.every(t => selected.has(t.id));
  const someOnPageSelected = paginated.some(t => selected.has(t.id));

  const chipCounts = {
    all: stats.total,
    pending: stats.pending,
    completed: stats.completed,
    overdue: stats.overdue,
    high: dateScoped.filter(t => t.priority === 'high' && !t.done).length,
    medium: dateScoped.filter(t => t.priority === 'medium' && !t.done).length,
    low: dateScoped.filter(t => t.priority === 'low' && !t.done).length,
  };

  const chips = [
    { id: 'all', icon: 'fa-layer-group', label: 'All' },
    { id: 'pending', icon: 'fa-clock', label: 'Pending' },
    { id: 'completed', icon: 'fa-check-circle', label: 'Completed' },
    { id: 'overdue', icon: 'fa-exclamation-triangle', label: 'Overdue' },
    { id: 'high', emoji: '🔴', label: 'High' },
    { id: 'medium', emoji: '🟡', label: 'Medium' },
    { id: 'low', emoji: '🟢', label: 'Low' },
  ];

  const dateLabel = useMemo(() => {
    if (dateNav.mode === 'all') return 'Showing all tasks';
    if (dateNav.mode === 'week') return 'Showing tasks for This Week';
    if (dateNav.mode === 'today') return 'Showing tasks for Today';
    if (dateNav.mode === 'tomorrow') return 'Showing tasks for Tomorrow';
    const d = new Date(dateNav.activeDate + 'T00:00:00');
    return `Showing tasks for ${d.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;
  }, [dateNav]);

  return (
    <section className="module">
      <div className="module-header">
        <h3><i className="fas fa-tasks"></i> Task Management</h3>
        <div className="module-actions">
          <button className="primary-btn" onClick={handleAdd}>
            <i className="fas fa-plus"></i> Add Task
          </button>
        </div>
      </div>

      <DateNavigator 
        mode={dateNav.mode} 
        activeDate={dateNav.activeDate}
        onChange={(next) => { setDateNav(next); setPage(1); setSelected(new Set()); }}
      />

      <div className="active-date-label">
        <i className="fas fa-calendar-check"></i>
        <span>{dateLabel}</span>
        <span className="active-date-count">
          {stats.total} task{stats.total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="task-stats-grid">
        <div className="task-stat-card total">
          <div className="task-stat-icon blue"><i className="fas fa-list-check"></i></div>
          <div className="task-stat-info">
            <h4>{stats.total}</h4>
            <p>Total Tasks</p>
          </div>
        </div>
        <div className="task-stat-card completed">
          <div className="task-stat-icon green"><i className="fas fa-check-circle"></i></div>
          <div className="task-stat-info">
            <h4>{stats.completed}</h4>
            <p>Completed</p>
          </div>
        </div>
        <div className="task-stat-card pending">
          <div className="task-stat-icon yellow"><i className="fas fa-clock"></i></div>
          <div className="task-stat-info">
            <h4>{stats.pending}</h4>
            <p>Pending</p>
          </div>
        </div>
        <div className="task-stat-card overdue">
          <div className="task-stat-icon red"><i className="fas fa-exclamation-triangle"></i></div>
          <div className="task-stat-info">
            <h4>{stats.overdue}</h4>
            <p>Overdue</p>
          </div>
        </div>
      </div>

      <div className="task-progress-section">
        <div className="task-progress-info">
          <h4>Progress <span>{stats.percent}%</span></h4>
          <div className="task-progress-bar">
            <div className="task-progress-fill" style={{ width: `${stats.percent}%` }}></div>
          </div>
        </div>
        <div className="task-progress-stats">
          <div className="task-progress-stat">
            <span className="dot completed"></span>
            <span>Done: <strong>{stats.completed}</strong></span>
          </div>
          <div className="task-progress-stat">
            <span className="dot pending"></span>
            <span>Pending: <strong>{stats.pending}</strong></span>
          </div>
          <div className="task-progress-stat">
            <span className="dot overdue"></span>
            <span>Overdue: <strong>{stats.overdue}</strong></span>
          </div>
        </div>
      </div>

      <div className="filter-chips">
        {chips.map(c => (
          <button
            key={c.id}
            className={`filter-chip ${filter === c.id ? 'active' : ''}`}
            onClick={() => { setFilter(c.id); setPage(1); }}
          >
            {c.icon ? <i className={`fas ${c.icon}`}></i> : c.emoji} {c.label}
            <span className="chip-count">{chipCounts[c.id]}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="filter-group">
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="all">All Categories</option>
            <option value="work">💼 Work</option>
            <option value="personal">🏠 Personal</option>
            <option value="urgent">🚨 Urgent</option>
            <option value="learning">📚 Learning</option>
            <option value="health">💪 Health</option>
            <option value="finance">💰 Finance</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="due">Due Date</option>
            <option value="priority">Priority</option>
            <option value="alpha">A-Z</option>
          </select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="bulk-actions-bar show">
          <span className="bulk-count">{selected.size} task{selected.size !== 1 ? 's' : ''} selected</span>
          <button className="bulk-complete" onClick={handleBulkComplete}>
            <i className="fas fa-check"></i> Mark Complete
          </button>
          <button className="bulk-delete" onClick={handleBulkDelete}>
            <i className="fas fa-trash"></i> Delete Selected
          </button>
          <button className="bulk-cancel" onClick={clearSelection}>
            <i className="fas fa-times"></i> Cancel
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="select-all-wrapper">
          <input
            type="checkbox"
            id="selectAll"
            checked={allOnPageSelected}
            ref={el => { if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected; }}
            onChange={selectAllOnPage}
          />
          <label htmlFor="selectAll">Select All (this page)</label>
        </div>
      )}

      {paginated.length === 0 ? (
        <div className="empty-state-enhanced">
          <div className="empty-illustration">
            <i className="fas fa-clipboard-list"></i>
          </div>
          <h3>No tasks found</h3>
          <p>
            {search ? 'No tasks match your search.' 
              : filter !== 'all' ? 'No tasks match this filter.'
              : dateNav.mode === 'today' ? 'Wala kang tasks ngayong araw. Add one!'
              : 'Add a task with this due date, or pick another date above.'}
          </p>
          <button className="primary-btn" onClick={handleAdd}>
            <i className="fas fa-plus"></i> Add Task
          </button>
        </div>
      ) : (
        <>
          {paginated.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onView={setDetailTask}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemLabel="tasks"
            onPageChange={setPage}
          />
        </>
      )}

      <TaskModal
        show={showTaskModal}
        task={editingTask}
        defaultDueDate={dateNav.mode !== 'all' && dateNav.mode !== 'week' ? dateNav.activeDate : todayISO()}
        onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
        onSave={handleSave}
      />

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <ConfirmModal
        show={!!deletingTask}
        title="Delete Task?"
        message="This task will be permanently removed. This action cannot be undone."
        preview={deletingTask?.text}
        confirmText="Delete Task"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingTask(null)}
      />
    </section>
  );
}