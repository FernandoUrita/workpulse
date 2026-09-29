import { useState } from 'react';
import { useAppData } from '../../context/AppDataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { escapeHtml, isOverdue, isDueToday, formatDate, formatDateTime } from '../../utils/helpers.js';
import { TASK_PRIORITY_LABELS, TASK_CATEGORY_LABELS } from '../../utils/constants.js';

export default function TaskDetailModal({ task, onClose, onToggle, onEdit, onDelete }) {
  const { addRemark, deleteRemark } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [newRemark, setNewRemark] = useState('');

  // Pagination state
  const [visibleRemarks, setVisibleRemarks] = useState(10);
  const [visibleHistory, setVisibleHistory] = useState(20);

  if (!task) return null;

  const priority = TASK_PRIORITY_LABELS[task.priority] || TASK_PRIORITY_LABELS.medium;
  const category = TASK_CATEGORY_LABELS[task.category] || '';

  let dueInfo = 'No due date';
  if (task.dueDate) {
    const formatted = formatDate(task.dueDate, { weekday: 'long', month: 'long' });
    if (task.done) dueInfo = `📅 ${formatted}`;
    else if (isOverdue(task.dueDate)) dueInfo = `⚠️ Overdue: ${formatted}`;
    else if (isDueToday(task.dueDate)) dueInfo = `📅 Due Today (${formatted})`;
    else dueInfo = `📅 ${formatted}`;
  }

  const allRemarks = task.remarks || [];
  const allHistory = task.auditLog || [];

  // Sliced for display
  const remarks = allRemarks.slice(-visibleRemarks); // Latest first (reverse)
  const history = [...allHistory].reverse().slice(0, visibleHistory);

  const hasMoreRemarks = allRemarks.length > visibleRemarks;
  const hasMoreHistory = allHistory.length > visibleHistory;

  const handleAddRemark = () => {
    if (!newRemark.trim()) {
      showToast('warning', 'Empty Remark', 'Please write something before posting.');
      return;
    }
    addRemark(task.id, newRemark.trim());
    setNewRemark('');
    showToast('success', 'Remark Added', 'Your remark has been posted.');
  };

  const handleDeleteRemark = (remarkId) => {
    deleteRemark(task.id, remarkId);
    showToast('success', 'Remark Deleted', 'The remark has been removed.');
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: 'fa-info-circle' },
    { id: 'remarks', label: 'Remarks', icon: 'fa-comments', count: allRemarks.length },
    { id: 'history', label: 'History', icon: 'fa-history', count: allHistory.length },
  ];

  return (
    <div className="modal show task-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h3><i className="fas fa-clipboard-check"></i> Task Details</h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>

        {/* ─── TASK HEADER ─── */}
        <div className="task-detail-header">
          <div
            className={`task-detail-check ${task.done ? 'checked' : ''}`}
            onClick={() => onToggle(task.id)}
          >
            {task.done && '✓'}
          </div>
          <div className={`task-detail-title ${task.done ? 'done' : ''}`}>
            {escapeHtml(task.text)}
          </div>
        </div>

        {/* ─── TABS ─── */}
        <div className="task-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`task-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span>{tab.label}</span>
              {tab.count > 0 && <span className="task-tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* ─── TAB CONTENT ─── */}
        <div className="task-tab-content">
          {/* ═══ DETAILS TAB ═══ */}
          {activeTab === 'details' && (
            <div className="task-detail-body">
              {task.description && (
                <div className="task-detail-section">
                  <h5><i className="fas fa-align-left"></i> Description</h5>
                  <p>{escapeHtml(task.description)}</p>
                </div>
              )}

              <div className="task-detail-section">
                <h5><i className="fas fa-info-circle"></i> Details</h5>
                <div className="task-detail-badges">
                  <span className={`tag tag-${task.priority || 'medium'}`}>
                    {priority.emoji} {priority.label}
                  </span>
                  {category && <span className="tag tag-general">{category}</span>}
                  {task.done
                    ? <span className="tag tag-completed">✅ Completed</span>
                    : <span className="tag tag-medium">⏳ Pending</span>
                  }
                </div>
              </div>

              <div className="task-detail-meta-grid">
                <div className="task-detail-meta-item">
                  <span className="label">Due Date</span>
                  <span className="value">{dueInfo}</span>
                </div>
                <div className="task-detail-meta-item">
                  <span className="label">Assignees</span>
                  <span className="value">
                    {Array.isArray(task.assignees) && task.assignees.length > 0
                      ? task.assignees.map(a => `👤 ${escapeHtml(a)}`).join(', ')
                      : '—'}
                  </span>
                </div>
                <div className="task-detail-meta-item">
                  <span className="label">Created</span>
                  <span className="value">
                    {task.createdAt ? formatDate(new Date(task.createdAt).toISOString().slice(0,10), { month: 'long' }) : '—'}
                  </span>
                </div>
                <div className="task-detail-meta-item">
                  <span className="label">Last Updated</span>
                  <span className="value">
                    {task.updatedAt ? formatDate(new Date(task.updatedAt).toISOString().slice(0,10), { month: 'long' }) : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ═══ REMARKS TAB ═══ */}
          {activeTab === 'remarks' && (
            <div className="task-remarks">
              {/* Add remark form */}
              <div className="remark-form">
                <textarea
                  placeholder="Write a remark..."
                  value={newRemark}
                  onChange={(e) => setNewRemark(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <div className="remark-form-footer">
                  <span className="remark-char-count">{newRemark.length}/500</span>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleAddRemark}
                    disabled={!newRemark.trim()}
                  >
                    <i className="fas fa-paper-plane"></i> Post Remark
                  </button>
                </div>
              </div>

              {/* Remarks list */}
              {remarks.length === 0 ? (
                <div className="remarks-empty">
                  <i className="fas fa-comment-slash"></i>
                  <p>No remarks yet</p>
                  <span>Add the first remark above</span>
                </div>
                ) : (
                  <>
                    <div className="remarks-list">
                      {remarks.map(remark => {
                        const isAuthor = currentUser?.username === remark.author;
                        return (
                          <div key={remark.id} className="remark-item">
                            <div className="remark-avatar">
                              <i className="fas fa-user-circle"></i>
                            </div>
                            <div className="remark-content">
                              <div className="remark-meta">
                                <strong>{escapeHtml(remark.authorName || remark.author || 'Unknown')}</strong>
                                <span className="remark-time">
                                  {formatDateTime(remark.timestamp)}
                                </span>
                              </div>
                              <div className="remark-text">{escapeHtml(remark.text)}</div>
                            </div>
                            {isAuthor && (
                              <button
                                type="button"
                                className="remark-delete"
                                onClick={() => handleDeleteRemark(remark.id)}
                                title="Delete remark"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {hasMoreRemarks && (
                      <button
                        type="button"
                        className="load-more-btn"
                        onClick={() => setVisibleRemarks(v => v + 10)}
                      >
                        <i className="fas fa-chevron-down"></i>
                        Load more remarks ({allRemarks.length - visibleRemarks} remaining)
                      </button>
                    )}
                    {allRemarks.length > 10 && (
                      <div className="items-shown-footer">
                        Showing {Math.min(visibleRemarks, allRemarks.length)} of {allRemarks.length}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          {/* ═══ HISTORY TAB ═══ */}
          {activeTab === 'history' && (
            <div className="task-history">
                            {allHistory.length === 0 ? (
                <div className="remarks-empty">
                  <i className="fas fa-history"></i>
                  <p>No history yet</p>
                  <span>Changes will appear here</span>
                </div>
              ) : (
                <>
                  <div className="history-list">
                    {history.map(entry => (
                      <div key={entry.id} className="history-item">
                        <div className="history-icon">
                          <i className={`fas ${
                            entry.action === 'created' ? 'fa-plus-circle' :
                            entry.action === 'completed' ? 'fa-check-circle' :
                            entry.action === 'reopened' ? 'fa-undo' :
                            entry.action === 'updated' ? 'fa-edit' :
                            entry.action === 'remark_added' ? 'fa-comment' :
                            'fa-circle'
                          }`}></i>
                        </div>
                        <div className="history-content">
                          <div className="history-action">
                            <strong>{escapeHtml(entry.user || 'system')}</strong>{' '}
                            {entry.action === 'created' && 'created this task'}
                            {entry.action === 'completed' && 'marked it as complete'}
                            {entry.action === 'reopened' && 'reopened the task'}
                            {entry.action === 'updated' && 'updated'}
                            {entry.action === 'remark_added' && 'added a remark'}
                          </div>
                          {entry.changes && (
                            <div className="history-changes">
                              {Object.entries(entry.changes).map(([field, { from, to }]) => (
                                <div key={field} className="history-change">
                                  <span className="change-field">{field}:</span>
                                  <span className="change-from">{String(from || '—')}</span>
                                  <i className="fas fa-arrow-right"></i>
                                  <span className="change-to">{String(to || '—')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="history-time">{formatDateTime(entry.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasMoreHistory && (
                    <button
                      type="button"
                      className="load-more-btn"
                      onClick={() => setVisibleHistory(v => v + 20)}
                    >
                      <i className="fas fa-chevron-down"></i>
                      Load more history ({allHistory.length - visibleHistory} remaining)
                    </button>
                  )}
                  {allHistory.length > 20 && (
                    <div className="items-shown-footer">
                      Showing {Math.min(visibleHistory, allHistory.length)} of {allHistory.length}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── FOOTER ─── */}
        <div className="modal-footer">
          <button className="secondary-btn" onClick={() => onEdit(task)}>
            <i className="fas fa-edit"></i> Edit
          </button>
          <button className="danger-btn" onClick={() => onDelete(task)}>
            <i className="fas fa-trash"></i> Delete
          </button>
          <button className="primary-btn" onClick={() => onToggle(task.id)}>
            <i className={`fas fa-${task.done ? 'undo' : 'check'}`}></i>
            {task.done ? ' Mark Pending' : ' Mark Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}
