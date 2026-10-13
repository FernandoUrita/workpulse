import { useModalDialog } from '../../hooks/useModalDialog.js';
import { useState } from 'react';
import { useAppData } from '../../context/AppDataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { escapeHtml, formatDate, formatDateTime } from '../../utils/helpers.js';
import { computeAging, getStatusClass, getPriorityClass } from '../../utils/ticketHelpers.js';

const PAGE_REMARKS = 10;
const PAGE_HISTORY = 20;

const ACTION_META = {
  created:          { icon: 'fa-plus-circle',  label: 'created this ticket',  class: 'created' },
  updated:          { icon: 'fa-edit',         label: 'updated',              class: 'updated' },
  remark_added:     { icon: 'fa-comment',      label: 'added a remark',       class: 'remark' },
  imported:         { icon: 'fa-file-import',  label: 'imported this ticket', class: 'created' },
};

export default function TicketDetailModal({ ticket, onClose, onEdit, onDelete }) {
  const dialogProps = useModalDialog(Boolean(ticket), onClose);
  const { addTicketRemark, deleteTicketRemark } = useAppData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [newRemark, setNewRemark] = useState('');
  const [visibleRemarks, setVisibleRemarks] = useState(PAGE_REMARKS);
  const [visibleHistory, setVisibleHistory] = useState(PAGE_HISTORY);
  const [historyFilter, setHistoryFilter] = useState('all');

  if (!ticket) return null;

  const aging = computeAging(ticket.dateCreated);
  const statusClass = getStatusClass(ticket.status);
  const priorityClass = getPriorityClass(ticket.priority);

    const allRemarks = ticket.comments || [];
  const allHistory = ticket.auditLog || [];

  const filteredHistory = (() => {
    if (historyFilter === 'all') return allHistory;
    if (historyFilter === 'updates') return allHistory.filter(e => e.action === 'updated');
    if (historyFilter === 'remarks') return allHistory.filter(e => e.action === 'remark_added');
    if (historyFilter === 'status') {
      return allHistory.filter(e => e.changes && (e.changes.status || e.changes.priority));
    }
    return allHistory;
  })();

  const remarks = allRemarks.slice(-visibleRemarks);
  const history = [...filteredHistory].reverse().slice(0, visibleHistory);

  const hasMoreRemarks = allRemarks.length > visibleRemarks;
  const hasMoreHistory = filteredHistory.length > visibleHistory;
  const uniqueUsers = new Set(allHistory.map(e => e.user)).size;

  const handleAddRemark = () => {
    if (!newRemark.trim()) {
      showToast('warning', 'Empty Remark', 'Please write something before posting.');
      return;
    }
    addTicketRemark(ticket.id, newRemark.trim());
    setNewRemark('');
    showToast('success', 'Remark Added', 'Your remark has been posted.');
  };

  const handleDeleteRemark = (remarkId) => {
    deleteTicketRemark(ticket.id, remarkId);
    showToast('success', 'Remark Deleted', 'The remark has been removed.');
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: 'fa-info-circle' },
    { id: 'remarks', label: 'Remarks', icon: 'fa-comments', count: allRemarks.length },
    { id: 'history', label: 'History', icon: 'fa-history', count: allHistory.length },
  ];

  return (
    <div className="modal show ticket-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div {...dialogProps} className="modal-content" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-ticket-alt"></i>
            Ticket #{ticket.ticketNo || '—'}
          </h3>
          <button className="close-modal" type="button" aria-label="Close dialog" onClick={onClose}>&times;</button>
        </div>

        {/* ─── HEADER ─── */}
        <div className="ticket-detail-header">
          <div className="ticket-detail-title">
            {escapeHtml(ticket.subject || ticket.remarks || 'No subject')}
          </div>
          <div className="ticket-detail-badges">
            <span className={`ticket-badge ${statusClass}`}>{ticket.status}</span>
            <span className={`ticket-badge ${priorityClass}`}>
              {ticket.priority === 'Critical' && '🚨'}
              {ticket.priority === 'High' && '🔴'}
              {ticket.priority === 'Medium' && '🟡'}
              {ticket.priority === 'Low' && '🟢'}
              {' '}{ticket.priority}
            </span>
            {aging && (
              <span className={`ticket-aging aging-${aging.toLowerCase().replace(/\s+/g, '-')}`}>
                <i className="fas fa-hourglass-half"></i> {aging}
              </span>
            )}
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
            <div className="ticket-detail-body">
              {ticket.remarks && (
                <div className="ticket-detail-section">
                  <h5><i className="fas fa-align-left"></i> Remarks</h5>
                  <p>{escapeHtml(ticket.remarks)}</p>
                </div>
              )}

              <div className="ticket-detail-meta-grid">
                <div className="ticket-detail-meta-item">
                  <span className="label">Client</span>
                  <span className="value">
                    <i className="fas fa-building"></i> {escapeHtml(ticket.clientName || '—')}
                  </span>
                </div>
                <div className="ticket-detail-meta-item">
                  <span className="label">Category</span>
                  <span className="value">
                    <i className="fas fa-tag"></i> {ticket.category || '—'}
                  </span>
                </div>
                <div className="ticket-detail-meta-item">
                  <span className="label">Pending To</span>
                  <span className="value">
                    <i className="fas fa-user-tie"></i> {ticket.pendingTo || '—'}
                  </span>
                </div>
                <div className="ticket-detail-meta-item">
                  <span className="label">Timeline</span>
                  <span className="value">
                    <i className="fas fa-calendar-day"></i> {ticket.timeline ? formatDate(ticket.timeline, { month: 'long' }) : '—'}
                  </span>
                </div>
                <div className="ticket-detail-meta-item">
                  <span className="label">Date Created</span>
                  <span className="value">
                    <i className="fas fa-calendar-plus"></i> {ticket.dateCreated ? formatDateTime(ticket.dateCreated) : '—'}
                  </span>
                </div>
                <div className="ticket-detail-meta-item">
                  <span className="label">Date Last Update</span>
                  <span className="value">
                    <i className="fas fa-clock"></i> {ticket.dateLastUpdate ? formatDateTime(ticket.dateLastUpdate) : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ═══ REMARKS TAB ═══ */}
          {activeTab === 'remarks' && (
            <div className="task-remarks">
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
                              <span className="remark-time">{formatDateTime(remark.timestamp)}</span>
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
                      onClick={() => setVisibleRemarks(v => v + PAGE_REMARKS)}
                    >
                      <i className="fas fa-chevron-down"></i>
                      Load more remarks ({allRemarks.length - visibleRemarks} remaining)
                    </button>
                  )}
                  {allRemarks.length > PAGE_REMARKS && (
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
                  <div className="history-stats">
                    <div className="history-stat">
                      <i className="fas fa-history"></i>
                      <span><strong>{allHistory.length}</strong> total changes</span>
                    </div>
                    <div className="history-stat">
                      <i className="fas fa-users"></i>
                      <span>by <strong>{uniqueUsers}</strong> user{uniqueUsers !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="history-filters">
                    {[
                      { id: 'all', label: 'All', icon: 'fa-layer-group' },
                      { id: 'updates', label: 'Updates', icon: 'fa-edit' },
                      { id: 'remarks', label: 'Remarks', icon: 'fa-comment' },
                      { id: 'status', label: 'Status', icon: 'fa-info-circle' },
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        className={`history-filter-chip ${historyFilter === f.id ? 'active' : ''}`}
                        onClick={() => { setHistoryFilter(f.id); setVisibleHistory(PAGE_HISTORY); }}
                      >
                        <i className={`fas ${f.icon}`}></i>
                        <span>{f.label}</span>
                      </button>
                    ))}
                  </div>

                  {filteredHistory.length === 0 ? (
                    <div className="remarks-empty">
                      <i className="fas fa-filter"></i>
                      <p>No entries match this filter</p>
                    </div>
                  ) : (
                    <>
                      <div className="history-list">
                        {history.map(entry => {
                          const meta = ACTION_META[entry.action] || { icon: 'fa-circle', label: entry.action, class: 'default' };
                          return (
                            <div key={entry.id} className="history-item">
                              <div className={`history-icon ${meta.class}`}>
                                <i className={`fas ${meta.icon}`}></i>
                              </div>
                              <div className="history-content">
                                <div className="history-action">
                                  <strong>{escapeHtml(entry.user || 'system')}</strong>{' '}
                                  {meta.label}
                                </div>
                                {entry.changes && (
                                  <div className="history-changes">
                                    {Object.entries(entry.changes).map(([field, { from, to }]) => (
                                      <div key={field} className="history-change">
                                        <span className="change-field">{field}:</span>
                                        <span className="change-from">
                                          {Array.isArray(from) ? from.join(', ') || '—' : String(from || '—')}
                                        </span>
                                        <i className="fas fa-arrow-right"></i>
                                        <span className="change-to">
                                          {Array.isArray(to) ? to.join(', ') || '—' : String(to || '—')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="history-time">{formatDateTime(entry.timestamp)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {hasMoreHistory && (
                        <button
                          type="button"
                          className="load-more-btn"
                          onClick={() => setVisibleHistory(v => v + PAGE_HISTORY)}
                        >
                          <i className="fas fa-chevron-down"></i>
                          Load more history ({filteredHistory.length - visibleHistory} remaining)
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── FOOTER ─── */}
        <div className="modal-footer">
          <button className="secondary-btn" onClick={() => onEdit(ticket)}>
            <i className="fas fa-edit"></i> Edit
          </button>
          <button className="danger-btn" onClick={() => onDelete(ticket)}>
            <i className="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
