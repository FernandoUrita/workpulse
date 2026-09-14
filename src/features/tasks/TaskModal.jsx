import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { todayISO } from '../../utils/helpers.js';

const EMPTY = {
  text: '',
  description: '',
  priority: 'medium',
  category: 'work',
  dueDate: '',
  assignee: '',
};

export default function TaskModal({ show, task, defaultDueDate, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [titleError, setTitleError] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (show) {
      if (task) {
        setForm({
          text: task.text || '',
          description: task.description || '',
          priority: task.priority || 'medium',
          category: task.category || 'work',
          dueDate: task.dueDate || '',
          assignee: task.assignee || '',
        });
      } else {
        setForm({ ...EMPTY, dueDate: defaultDueDate || todayISO() });
      }
      setTitleError(false);
    }
  }, [show, task, defaultDueDate]);

  if (!show) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      assignee: form.assignee.trim(),
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
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            <i className={`fas fa-${task ? 'edit' : 'plus-circle'}`}></i>
            {task ? ' Edit Task' : ' Add New Task'}
          </h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
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
              <label><i className="fas fa-user"></i> Assignee</label>
              <input
                type="text"
                name="assignee"
                value={form.assignee}
                onChange={handleChange}
                placeholder="Who is responsible?"
                maxLength={50}
              />
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
