import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { ITEM_STATUS_OPTIONS, ITEM_PRIORITY_OPTIONS } from '../../utils/constants.js';

const EMPTY = {
  text: '',
  type: 'monitoring',
  ref: '',
  status: 'pending',
  priority: 'medium',
  notes: '',
  // Monitoring
  nextCheck: '',
  // Project
  progress: 0,
  endDate: '',
  // Issue
  severity: 'p3',
  reporter: '',
  // Custom Request
  client: '',
  requestedBy: '',
  link: '',
  targetDate: '',
};

const TYPE_OPTIONS = [
  { value: 'monitoring', label: 'Monitoring', sub: 'Hypercare', icon: 'fa-server' },
  { value: 'project', label: 'Project', sub: 'Tracker', icon: 'fa-briefcase' },
  { value: 'issue', label: 'Issue', sub: 'Incident', icon: 'fa-bug' },
  { value: 'custom', label: 'Custom Request', sub: 'Client', icon: 'fa-clipboard-list' },
];

export default function ItemModal({ show, item, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [clientError, setClientError] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (show) {
      if (item) {
        setForm({
          text: item.text || '',
          type: item.type || 'monitoring',
          ref: item.ref || '',
          status: item.status || 'pending',
          priority: item.priority || 'medium',
          notes: item.notes || '',
          nextCheck: item.nextCheck || '',
          progress: item.progress || 0,
          endDate: item.endDate || '',
          severity: item.severity || 'p3',
          reporter: item.reporter || '',
          client: item.client || '',
          requestedBy: item.requestedBy || '',
          link: item.link || '',
          targetDate: item.targetDate || '',
        });
        setTags(item.tags || []);
      } else {
        setForm(EMPTY);
        setTags([]);
      }
      setTagInput('');
      setTitleError(false);
      setClientError(false);
    }
  }, [show, item]);

  if (!show) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTypeChange = (type) => {
    setForm({ ...form, type });
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (!tag) return;
    if (tags.includes(tag)) {
      setTagInput('');
      return;
    }
    if (tags.length >= 8) {
      showToast('warning', 'Tag Limit', 'Maximum 8 tags per item.');
      return;
    }
    setTags([...tags, tag]);
    setTagInput('');
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = () => {
    if (!form.text.trim()) {
      setTitleError(true);
      showToast('warning', 'Missing Title', 'Please enter a title.');
      return;
    }

    if (form.type === 'custom' && !form.client.trim()) {
      setClientError(true);
      showToast('warning', 'Missing Client', 'Client name is required.');
      return;
    }

    const data = {
      text: form.text.trim(),
      type: form.type,
      ref: form.ref.trim(),
      status: form.status,
      priority: form.priority,
      notes: form.notes.trim(),
      tags,
    };

    if (form.type === 'monitoring') {
      data.nextCheck = form.nextCheck;
    } else if (form.type === 'project') {
      data.progress = parseInt(form.progress) || 0;
      data.endDate = form.endDate;
    } else if (form.type === 'issue') {
      data.severity = form.severity;
      data.reporter = form.reporter.trim();
    } else if (form.type === 'custom') {
      data.client = form.client.trim();
      data.requestedBy = form.requestedBy.trim();
      data.link = form.link.trim();
      data.targetDate = form.targetDate;
    }

    onSave(data);
    showToast(
      'success',
      item ? 'Item Updated' : 'Item Added',
      `"${form.text.trim()}" has been ${item ? 'updated' : 'added'}.`
    );
  };

  return (
    <div className="modal show item-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            <i className={`fas fa-${item ? 'edit' : 'plus-circle'}`}></i>
            {item ? ' Edit Item' : ' Add New Item'}
          </h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            {/* Type Selector */}
            <div className="form-group full-width">
              <label><i className="fas fa-cubes"></i> Item Type <span className="required">*</span></label>
              <div className="item-type-selector">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`item-type-btn ${form.type === opt.value ? 'active' : ''}`}
                    onClick={() => handleTypeChange(opt.value)}
                  >
                    <i className={`fas ${opt.icon}`}></i>
                    <span>{opt.label}</span>
                    <small>{opt.sub}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="form-group full-width">
              <label><i className="fas fa-heading"></i> Title <span className="required">*</span></label>
              <input
                type="text"
                name="text"
                value={form.text}
                onChange={handleChange}
                placeholder="e.g., Client ABC Hypercare, Project XYZ"
                maxLength={120}
                autoFocus
                className={titleError ? 'error' : ''}
              />
              {titleError && (
                <span className="field-error show">
                  <i className="fas fa-exclamation-circle"></i> Title is required
                </span>
              )}
            </div>

            {/* Reference */}
            <div className="form-group">
              <label><i className="fas fa-hashtag"></i> Reference</label>
              <input
                type="text"
                name="ref"
                value={form.ref}
                onChange={handleChange}
                placeholder="e.g., TICKET-1234"
                maxLength={60}
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label><i className="fas fa-circle-half-stroke"></i> Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                {ITEM_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label><i className="fas fa-flag"></i> Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                {ITEM_PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Monitoring Fields */}
            {form.type === 'monitoring' && (
              <div className="form-group">
                <label><i className="fas fa-calendar-check"></i> Next Check-in</label>
                <input
                  type="date"
                  name="nextCheck"
                  value={form.nextCheck}
                  onChange={handleChange}
                />
              </div>
            )}

            {/* Project Fields */}
            {form.type === 'project' && (
              <>
                <div className="form-group">
                  <label><i className="fas fa-percent"></i> Progress %</label>
                  <input
                    type="number"
                    name="progress"
                    value={form.progress}
                    onChange={handleChange}
                    min={0}
                    max={100}
                    placeholder="0-100"
                  />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-calendar-xmark"></i> Target End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* Issue Fields */}
            {form.type === 'issue' && (
              <>
                <div className="form-group">
                  <label><i className="fas fa-triangle-exclamation"></i> Severity</label>
                  <select name="severity" value={form.severity} onChange={handleChange}>
                    <option value="p1">P1 - Critical</option>
                    <option value="p2">P2 - Major</option>
                    <option value="p3">P3 - Minor</option>
                    <option value="p4">P4 - Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label><i className="fas fa-user-pen"></i> Reported By</label>
                  <input
                    type="text"
                    name="reporter"
                    value={form.reporter}
                    onChange={handleChange}
                    placeholder="Name of reporter"
                    maxLength={60}
                  />
                </div>
              </>
            )}

            {/* Custom Request Fields */}
            {form.type === 'custom' && (
              <>
                <div className="form-group">
                  <label><i className="fas fa-calendar-day"></i> Target Date</label>
                  <input
                    type="date"
                    name="targetDate"
                    value={form.targetDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label><i className="fas fa-building"></i> Client <span className="required">*</span></label>
                  <input
                    type="text"
                    name="client"
                    value={form.client}
                    onChange={handleChange}
                    placeholder="e.g., ABC Corp, XYZ Ltd"
                    maxLength={80}
                    className={clientError ? 'error' : ''}
                  />
                  {clientError && (
                    <span className="field-error show">
                      <i className="fas fa-exclamation-circle"></i> Client name is required
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label><i className="fas fa-user-tie"></i> Requested By</label>
                  <input
                    type="text"
                    name="requestedBy"
                    value={form.requestedBy}
                    onChange={handleChange}
                    placeholder="e.g., John Smith"
                    maxLength={80}
                  />
                </div>
                <div className="form-group full-width">
                  <label><i className="fas fa-link"></i> Link / Ticket URL</label>
                  <input
                    type="url"
                    name="link"
                    value={form.link}
                    onChange={handleChange}
                    placeholder="https://jira.company.com/TICKET-1234"
                  />
                </div>
              </>
            )}

            {/* Notes */}
            <div className="form-group full-width">
              <label><i className="fas fa-align-left"></i> Notes / Description</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add details, observations, action items..."
                rows={3}
                maxLength={1000}
              />
            </div>

            {/* Tags */}
            <div className="form-group full-width">
              <label><i className="fas fa-tags"></i> Tags</label>
              <div className="tags-input-group">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Type a tag and press Enter..."
                  maxLength={30}
                />
                <button type="button" className="secondary-btn" onClick={addTag}>
                  <i className="fas fa-plus"></i> Add
                </button>
              </div>
              <div className="item-tags-list">
                {tags.length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    No tags added
                  </span>
                ) : (
                  tags.map(tag => (
                    <span key={tag} className="item-tag-pill">
                      #{tag}
                      <button type="button" className="remove-tag" onClick={() => removeTag(tag)}>×</button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleSubmit}>
            <i className="fas fa-save"></i> Save Item
          </button>
        </div>
      </div>
    </div>
  );
}
