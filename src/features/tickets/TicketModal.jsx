import { useModalDialog } from '../../hooks/useModalDialog.js';
import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';
import {
  generateNextTicketNo,
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  TICKET_PENDING_TO,
  TICKET_PRIORITIES,
} from '../../utils/ticketHelpers.js';

const EMPTY = {
  ticketNo: '',
  clientName: '',
  remarks: '',
  subject: '',
  dateLastUpdate: '',
  pendingTo: 'Client',
  status: 'Open',
  timeline: '',
  dateCreated: '',
  category: 'Explanation',
  priority: 'Medium',
  taskType: 'support',
};

export default function TicketModal({ show, ticket, defaultTaskType = 'support', onClose, onSave }) {
  const dialogProps = useModalDialog(show, onClose);
  const { tickets } = useAppData();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [ticketNoError, setTicketNoError] = useState('');

  useEffect(() => {
    if (!show) return;
    if (ticket) {
      setForm({
        ticketNo: ticket.ticketNo || '',
        clientName: ticket.clientName || '',
        remarks: ticket.remarks || '',
        subject: ticket.subject || '',
        dateLastUpdate: ticket.dateLastUpdate ? ticket.dateLastUpdate.slice(0, 16) : '',
        pendingTo: ticket.pendingTo || 'Client',
        status: ticket.status || 'Open',
        timeline: ticket.timeline || '',
        dateCreated: ticket.dateCreated ? ticket.dateCreated.slice(0, 16) : '',
        category: ticket.category || 'Explanation',
        priority: ticket.priority || 'Medium',
        taskType: ticket.taskType || defaultTaskType,
      });
    } else {
      const nextNo = generateNextTicketNo(tickets);
      setForm({
        ...EMPTY,
        ticketNo: nextNo,
        taskType: defaultTaskType,
        dateCreated: new Date().toISOString().slice(0, 16),
      });
    }
    setTicketNoError('');
  }, [show, ticket, defaultTaskType, tickets]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'ticketNo') setTicketNoError('');
  };

  const handleSubmit = () => {
    if (!form.ticketNo.trim()) {
      setTicketNoError('Ticket number is required');
      return;
    }
    if (!form.clientName.trim()) {
      showToast('warning', 'Missing Client', 'Please enter a client name.');
      return;
    }
    if (!form.subject.trim() && !form.remarks.trim()) {
      showToast('warning', 'Missing Subject', 'Please enter a subject or remarks.');
      return;
    }

    // Check uniqueness
    const duplicate = tickets.find(
      t => t.ticketNo === form.ticketNo.trim() && t.id !== ticket?.id
    );
    if (duplicate) {
      setTicketNoError(`Ticket #${form.ticketNo} already exists`);
      return;
    }

    // Convert DateTime-local to ISO
    const payload = {
      ...form,
      ticketNo: form.ticketNo.trim(),
      clientName: form.clientName.trim(),
      remarks: form.remarks.trim(),
      subject: form.subject.trim(),
      dateCreated: form.dateCreated
        ? new Date(form.dateCreated).toISOString()
        : new Date().toISOString(),
      dateLastUpdate: form.dateLastUpdate
        ? new Date(form.dateLastUpdate).toISOString()
        : '',
    };

    onSave(payload);
    showToast(
      'success',
      ticket ? 'Ticket Updated' : 'Ticket Created',
      `#${payload.ticketNo} has been ${ticket ? 'updated' : 'created'}.`
    );
  };

  return (
    <div className="modal show ticket-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div {...dialogProps} className="modal-content" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <h3>
            <i className={`fas fa-${ticket ? 'edit' : 'ticket-alt'}`}></i>
            {ticket ? ' Edit Ticket' : ' New Ticket'}
          </h3>
          <button className="close-modal" type="button" aria-label="Close dialog" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            {/* Ticket No */}
            <div className="form-group">
              <label><i className="fas fa-hashtag"></i> Ticket No. <span className="required">*</span></label>
              <input
                type="text"
                name="ticketNo"
                value={form.ticketNo}
                onChange={handleChange}
                placeholder="e.g., 11019"
                className={ticketNoError ? 'error' : ''}
              />
              {ticketNoError && (
                <span className="field-error show">
                  <i className="fas fa-exclamation-circle"></i> {ticketNoError}
                </span>
              )}
            </div>

            {/* Client Name */}
            <div className="form-group">
              <label><i className="fas fa-building"></i> Client Name <span className="required">*</span></label>
              <input
                type="text"
                name="clientName"
                value={form.clientName}
                onChange={handleChange}
                placeholder="e.g., OSM"
              />
            </div>

            {/* Subject */}
            <div className="form-group full-width">
              <label><i className="fas fa-heading"></i> Subject</label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="e.g., Tax Bracket Update in Payroll"
              />
            </div>

            {/* Remarks */}
            <div className="form-group full-width">
              <label><i className="fas fa-align-left"></i> Remarks</label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Short description..."
                rows={2}
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label><i className="fas fa-info-circle"></i> Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                {TICKET_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label><i className="fas fa-flag"></i> Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                {TICKET_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            {/* Category */}
            <div className="form-group">
              <label><i className="fas fa-tag"></i> Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                {TICKET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Pending To */}
            <div className="form-group">
              <label><i className="fas fa-user-tie"></i> Pending To?</label>
              <select name="pendingTo" value={form.pendingTo} onChange={handleChange}>
                {TICKET_PENDING_TO.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            {/* Timeline */}
            <div className="form-group">
              <label><i className="fas fa-calendar-day"></i> Timeline</label>
              <input
                type="date"
                name="timeline"
                value={form.timeline}
                onChange={handleChange}
              />
            </div>

            {/* Date Created */}
            <div className="form-group">
              <label><i className="fas fa-calendar-plus"></i> Date Created</label>
              <input
                type="datetime-local"
                name="dateCreated"
                value={form.dateCreated}
                onChange={handleChange}
              />
            </div>

            {/* Date Last Update */}
            <div className="form-group full-width">
              <label><i className="fas fa-clock"></i> Date Last Update</label>
              <input
                type="datetime-local"
                name="dateLastUpdate"
                value={form.dateLastUpdate}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleSubmit}>
            <i className="fas fa-save"></i> {ticket ? 'Save Changes' : 'Create Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}
