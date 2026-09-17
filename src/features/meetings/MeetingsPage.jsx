import { useState, useMemo } from 'react';
import { useAppData } from '../../context/AppDataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { isMeetingPast } from '../../utils/helpers.js';
import MeetingCard from './MeetingCard.jsx';
import MeetingModal from './MeetingModal.jsx';
import MomModal from './MomModal.jsx';
import ViewMomModal from './ViewMomModal.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';

export default function MeetingsPage() {
  const { 
    meetings, 
    addMeeting, 
    updateMeeting, 
    deleteMeeting, 
    completeMeeting 
  } = useAppData();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [momMeeting, setMomMeeting] = useState(null);
  const [viewingMom, setViewingMom] = useState(null);
  const [deletingMeeting, setDeletingMeeting] = useState(null);

  // ─── FILTERING ──────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...meetings];

    if (filter === 'upcoming') {
      result = result.filter(m => !isMeetingPast(m) && !m.completed);
    } else if (filter === 'past') {
      result = result.filter(m => isMeetingPast(m) && !m.completed);
    } else if (filter === 'completed') {
      result = result.filter(m => m.completed);
    } else if (filter === 'remote') {
      result = result.filter(m => m.type === 'remote');
    } else if (filter === 'physical') {
      result = result.filter(m => m.type === 'physical');
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(m =>
        m.title.toLowerCase().includes(q) ||
        (m.location && m.location.toLowerCase().includes(q)) ||
        (m.attendees && m.attendees.some(a => a.toLowerCase().includes(q)))
      );
    }

    return result.sort((a, b) => {
      const dateA = a.date ? new Date(`${a.date}T${a.time || '00:00'}`) : new Date(0);
      const dateB = b.date ? new Date(`${b.date}T${b.time || '00:00'}`) : new Date(0);
      return dateA - dateB;
    });
  }, [meetings, filter, search]);

  // ─── HANDLERS ───────────────────────────────────
  const handleAdd = () => {
    setEditingMeeting(null);
    setShowModal(true);
  };

  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
    setShowModal(true);
  };

  const handleSave = (data) => {
    if (editingMeeting) {
      updateMeeting(editingMeeting.id, data);
    } else {
      addMeeting(data);
    }
    setShowModal(false);
    setEditingMeeting(null);
  };

  const handleDelete = (meeting) => {
    setDeletingMeeting(meeting);
  };

  const confirmDelete = () => {
    if (deletingMeeting) {
      deleteMeeting(deletingMeeting.id);
      showToast('success', 'Meeting Deleted', `"${deletingMeeting.title}" has been removed.`);
      setDeletingMeeting(null);
    }
  };

  const handleOpenMom = (meeting) => {
    if (meeting.completed && meeting.mom) {
      setViewingMom(meeting);
    } else {
      setMomMeeting(meeting);
    }
  };

  const handleCompleteMeeting = (id, mom) => {
    completeMeeting(id, mom);
    setMomMeeting(null);
  };

  const handlePrint = (meeting) => {
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) {
      const content = meeting.mom || `Meeting: ${meeting.title}\nDate: ${meeting.date}\nTime: ${meeting.time}`;
      win.document.write(`
        <html>
          <head><title>Meeting - ${meeting.title}</title></head>
          <body style="font-family:monospace;padding:40px;background:#f8fafc;line-height:1.6;">
            <div style="max-width:800px;margin:0 auto;background:white;padding:40px;border-radius:12px;white-space:pre-wrap;">
              ${content.replace(/\n/g, '<br>')}
            </div>
            <div style="text-align:center;margin-top:20px;">
              <button onclick="window.print()" style="padding:10px 24px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;">🖨️ Print</button>
            </div>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <section className="module">
      <div className="module-header">
        <h3><i className="fas fa-calendar-alt"></i> Meeting Management</h3>
        <div className="module-actions">
          <button className="primary-btn" onClick={handleAdd}>
            <i className="fas fa-plus"></i> New Meeting
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="upcoming">📅 Upcoming</option>
            <option value="past">⏰ Past</option>
            <option value="completed">✅ Completed</option>
            <option value="remote">💻 Remote</option>
            <option value="physical">🏢 Physical</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state-enhanced">
          <div className="empty-illustration meetings">
            <i className="fas fa-calendar-times"></i>
          </div>
          <div className="empty-actions">{(search.trim() || filter !== 'all') && <button className="secondary-btn" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</button>}</div>
          <h3>{search.trim() || filter !== 'all' ? 'No matching meetings' : 'Plan your first meeting'}</h3>
          <p>
            {search ? 'No meetings match your search.' 
              : filter !== 'all' ? 'No meetings match this filter.'
              : 'Schedule your first meeting to get started!'}
          </p>
          <button className="primary-btn" onClick={handleAdd}>
            <i className="fas fa-plus"></i> New Meeting
          </button>
        </div>
      ) : (
        <div>
          {filtered.map(m => (
            <MeetingCard
              key={m.id}
              meeting={m}
              onViewMom={handleOpenMom}
              onPrint={handlePrint}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <MeetingModal
        show={showModal}
        meeting={editingMeeting}
        onClose={() => { setShowModal(false); setEditingMeeting(null); }}
        onSave={handleSave}
      />

      {momMeeting && (
        <MomModal
          show={!!momMeeting}
          meeting={momMeeting}
          onClose={() => setMomMeeting(null)}
          onComplete={handleCompleteMeeting}
        />
      )}

      {viewingMom && (
        <ViewMomModal
          show={!!viewingMom}
          meeting={viewingMom}
          onClose={() => setViewingMom(null)}
        />
      )}

      <ConfirmModal
        show={!!deletingMeeting}
        title="Delete Meeting?"
        message="This meeting and its MOM will be permanently removed. This action cannot be undone."
        preview={deletingMeeting?.title}
        confirmText="Delete Meeting"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingMeeting(null)}
      />
    </section>
  );
}
