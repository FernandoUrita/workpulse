import { useModalDialog } from '../../hooks/useModalDialog.js';
import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { todayISO } from '../../utils/helpers.js';

const EMPTY = {
  text: '',
  description: '',
  priority: 'medium',
  category: 'work',
  dueDate: '',
  assignees: [],
};

export default function TaskModal({ show, task, defaultDueDate, onClose, onSave }) {
  const dialogProps = useModalDialog(show, onClose);
  const [form, setForm] = useState(EMPTY);
  const [titleError, setTitleError] = useState(false);
  const [assigneeInput, setAssigneeInput] = useState('');
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (show) {
      if (task) {
        // Edit mode: use existing assignees
        setForm({
          text: task.text || '',
          description: task.description || '',
          priority: task.priority || 'medium',
          category: task.category || 'work',
          dueDate: task.dueDate || '',
          assignees: task.assignees || [],
        });
      } else {
        // New task: auto-fill current user
        setForm({
          ...EMPTY,
          dueDate: defaultDueDate || todayISO(),
          assignees: currentUser?.username ? [currentUser.username] : [],
        });
      }
      setAssigneeInput('');
      setTitleError(false);
    }
  }, [show, task, defaultDueDate, currentUser]);

  if (!show) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddAssignee = () => {
    const name = assigneeInput.trim();
    if (!name) return;
    if (form.assignees.includes(name)) {
      showToast('warning', 'Already Added', `"${name}" is already an assignee.`);
      return;
    }
    setForm({ ...form, assignees: [...form.assignees, name] });
    setAssigneeInput('');
  };

  const handleRemoveAssignee = (name) => {
    setForm({ ...form, assignees: form.assignees.filter(a => a !== name) });
  };

  const handleAssigneeKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddAssignee();
    }
  };

  const handleSubmit = () => {
    if (!form.text.trim()) {
      setTitleError(true);
      showToast('warning', 'Missing Title', 'Please enter a task title.');
      return;
    }
    onSave({
      ...form,
      text: form.text.trim(),
      description: form.description.trim(),
      assignees: form.assignees,
    });
    showToast(
      'success',
      task ? 'Task Updated' : 'Task Added',
      `"${form.text.trim()}" has been ${task ? 'updated' : 'created'}.`
    );
  };

  const priorities = [
    { value: 'high', emoji: '🔴', label: 'High' },
    { value: 'medium', emoji: '🟡', label: 'Medium' },
    { value: 'low', emoji: '🟢', label: 'Low' },
  ];

  return (
    <div className="modal show task-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div {...dialogProps} className="modal-content">
        <div className="modal-header">
          <h3>
            <i className={`fas fa-${task ? 'edit' : 'plus-circle'}`}></i>
            {task ? ' Edit Task' : ' Add New Task'}
          </h3>
          <button className="close-modal" type="button" aria-label="Close dialog" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group full-width">
              <label><i className="fas fa-heading"></i> Task Title <span className="required">*</span></label>
              <input
                type="text"
                name="text"
                value={form.text}
                onChange={handleChange}
                placeholder="e.g., Finish quarterly report"
                maxLength={100}
                autoFocus
                className={titleError ? 'error' : ''}
              />
              {titleError && (
                <span className="field-error show">
                  <i className="fas fa-exclamation-circle"></i> Title is required
                </span>
              )}
            </div>

            <div className="form-group full-width">
              <label><i className="fas fa-align-left"></i> Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Add more details..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="form-group full-width">
              <label><i className="fas fa-flag"></i> Priority <span className="required">*</span></label>
              <div className="priority-selector">
                {priorities.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    className={`priority-btn ${form.priority === p.value ? 'active' : ''}`}
                    data-priority={p.value}
                    onClick={() => setForm({ ...form, priority: p.value })}
                  >
                    <span className="priority-emoji">{p.emoji}</span>
                    <span className="priority-label">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label><i className="fas fa-folder"></i> Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="work">💼 Work</option>
                <option value="personal">🏠 Personal</option>
                <option value="urgent">🚨 Urgent</option>
                <option value="learning">📚 Learning</option>
                <option value="health">💪 Health</option>
                <option value="finance">💰 Finance</option>
              </select>
            </div>

            <div className="form-group">
              <label><i className="fas fa-calendar-day"></i> Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>
                <i className="fas fa-users"></i> Assignees
                <span className="label-hint">(default: you)</span>
              </label>

              {/* Assignee tags */}
              {form.assignees.length > 0 && (
                <div className="assignee-tags">
                  {form.assignees.map(a => (
                    <span key={a} className="assignee-tag">
                      <i className="fas fa-user-circle"></i>
                      {a}
                      <button
                        type="button"
                        className="assignee-remove"
                        onClick={() => handleRemoveAssignee(a)}
                        title="Remove"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add assignee input */}
              <div className="assignee-input-row">
                <input
                  type="text"
                  value={assigneeInput}
                  onChange={(e) => setAssigneeInput(e.target.value)}
                  onKeyDown={handleAssigneeKeyDown}
                  placeholder="Type username and press Enter..."
                  maxLength={50}
                />
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleAddAssignee}
                  disabled={!assigneeInput.trim()}
                >
                  <i className="fas fa-plus"></i> Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleSubmit}>
            <i className="fas fa-save"></i> Save Task
          </button>
        </div>
      </div>
    </div>
  );
}