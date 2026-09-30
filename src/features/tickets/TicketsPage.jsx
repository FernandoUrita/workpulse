import { useState, useMemo } from 'react';
import { useAppData } from '../../context/AppDataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { computeAging } from '../../utils/ticketHelpers.js';
import TicketCard from './TicketCard.jsx';
import TicketModal from './TicketModal.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import Pagination from '../../components/common/Pagination.jsx';

const PER_PAGE = 10;

const TABS = [
  { id: 'support', label: 'Support Task', icon: 'fa-headset' },
  { id: 'project', label: 'Project Task', icon: 'fa-briefcase' },
];

export default function TicketsPage() {
  const {
    tickets,
    addTicket,
    updateTicket,
    deleteTicket,
  } = useAppData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('support');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pendingFilter, setPendingFilter] = useState('all');
  const [agingFilter, setAgingFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [deletingTicket, setDeletingTicket] = useState(null);

  // Filter by tab
  const tabTickets = useMemo(
    () => (tickets || []).filter(t => (t.taskType || 'support') === activeTab),
    [tickets, activeTab]
  );

  // Filter + search + sort
  const filtered = useMemo(() => {
    let result = tabTickets;

    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    if (categoryFilter !== 'all') result = result.filter(t => t.category === categoryFilter);
    if (pendingFilter !== 'all') result = result.filter(t => t.pendingTo === pendingFilter);

    if (agingFilter !== 'all') {
      result = result.filter(t => computeAging(t.dateCreated) === agingFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(t =>
        (t.ticketNo || '').toLowerCase().includes(q) ||
        (t.clientName || '').toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q) ||
        (t.remarks || '').toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      if (sort === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sort === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sort === 'ticketNo-desc') return (parseInt(b.ticketNo, 10) || 0) - (parseInt(a.ticketNo, 10) || 0);
      if (sort === 'ticketNo-asc') return (parseInt(a.ticketNo, 10) || 0) - (parseInt(b.ticketNo, 10) || 0);
      if (sort === 'client') return (a.clientName || '').localeCompare(b.clientName || '');
      return 0;
    });
  }, [tabTickets, statusFilter, categoryFilter, pendingFilter, agingFilter, search, sort]);

  // Stats
  const stats = useMemo(() => {
    const total = tabTickets.length;
    const open = tabTickets.filter(t => t.status === 'Open').length;
    const inProgress = tabTickets.filter(t => t.status === 'In Progress').length;
    const closed = tabTickets.filter(t => t.status === 'Closed').length;
    const hypercare = tabTickets.filter(t => t.status === 'Hypercare').length;
    const onHold = tabTickets.filter(t => t.status === 'On Hold').length;
    return { total, open, inProgress, closed, hypercare, onHold };
  }, [tabTickets]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = Math.min(page, totalPages) || 1;
  const start = (currentPage - 1) * PER_PAGE;
  const paginated = filtered.slice(start, start + PER_PAGE);

  // Handlers
  const handleAdd = () => {
    setEditingTicket(null);
    setShowModal(true);
  };

  const handleEdit = (ticket) => {
    setEditingTicket(ticket);
    setShowModal(true);
  };

  const handleSave = (data) => {
    if (editingTicket) {
      updateTicket(editingTicket.id, data);
    } else {
      addTicket({ ...data, taskType: activeTab });
    }
    setShowModal(false);
    setEditingTicket(null);
  };

  const confirmDelete = () => {
    if (deletingTicket) {
      deleteTicket(deletingTicket.id);
      showToast('success', 'Ticket Deleted', `#${deletingTicket.ticketNo} has been removed.`);
      setDeletingTicket(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPendingFilter('all');
    setAgingFilter('all');
    setPage(1);
  };

  const hasActiveFilters =
    search.trim() ||
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    pendingFilter !== 'all' ||
    agingFilter !== 'all';

  return (
    <section className="module">
      <div className="module-header">
        <h3><i className="fas fa-ticket-alt"></i> Ticket Monitoring</h3>
        <div className="module-actions">
          <button className="primary-btn" onClick={handleAdd}>
            <i className="fas fa-plus"></i> New Ticket
          </button>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div className="ticket-tabs">
        {TABS.map(tab => {
          const count = (tickets || []).filter(t => (t.taskType || 'support') === tab.id).length;
          return (
            <button
              key={tab.id}
              type="button"
              className={`ticket-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span>{tab.label}</span>
              <span className="ticket-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ─── STATS ─── */}
      <div className="ticket-stats-grid">
        <div className="ticket-stat-card total">
          <div className="ticket-stat-icon blue"><i className="fas fa-ticket-alt"></i></div>
          <div className="ticket-stat-info">
            <h4>{stats.total}</h4>
            <p>Total Tickets</p>
          </div>
        </div>
        <div className="ticket-stat-card open">
          <div className="ticket-stat-icon green"><i className="fas fa-folder-open"></i></div>
          <div className="ticket-stat-info">
            <h4>{stats.open}</h4>
            <p>Open</p>
          </div>
        </div>
        <div className="ticket-stat-card progress">
          <div className="ticket-stat-icon yellow"><i className="fas fa-spinner"></i></div>
          <div className="ticket-stat-info">
            <h4>{stats.inProgress}</h4>
            <p>In Progress</p>
          </div>
        </div>
        <div className="ticket-stat-card hypercare">
          <div className="ticket-stat-icon red"><i className="fas fa-fire"></i></div>
          <div className="ticket-stat-info">
            <h4>{stats.hypercare}</h4>
            <p>Hypercare</p>
          </div>
        </div>
        <div className="ticket-stat-card closed">
          <div className="ticket-stat-icon purple"><i className="fas fa-check-circle"></i></div>
          <div className="ticket-stat-info">
            <h4>{stats.closed}</h4>
            <p>Closed</p>
          </div>
        </div>
      </div>

      {/* ─── FILTERS ─── */}
      <div className="toolbar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by ticket no, client, subject..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="filter-group">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="all">All Statuses</option>
            <option value="Open">🟢 Open</option>
            <option value="Hypercare">🔥 Hypercare</option>
            <option value="In Progress">🟡 In Progress</option>
            <option value="Closed">✅ Closed</option>
            <option value="On Hold">⏸️ On Hold</option>
          </select>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="all">All Categories</option>
            <option value="Explanation">💬 Explanation</option>
            <option value="Bug">🐛 Bug</option>
            <option value="Enhancement">✨ Enhancement</option>
            <option value="Customization">🔧 Customization</option>
          </select>
          <select value={pendingFilter} onChange={(e) => { setPendingFilter(e.target.value); setPage(1); }}>
            <option value="all">All Pending To</option>
            <option value="Client">👤 Client</option>
            <option value="Jeonsoft">🏢 Jeonsoft</option>
            <option value="Client, Jeonsoft">👤🏢 Client, Jeonsoft</option>
            <option value="Jeonsoft, Client">🏢👤 Jeonsoft, Client</option>
          </select>
          <select value={agingFilter} onChange={(e) => { setAgingFilter(e.target.value); setPage(1); }}>
            <option value="all">All Aging</option>
            <option value="Today">Today</option>
            <option value="1-3 Days">1-3 Days</option>
            <option value="4-7 Days">4-7 Days</option>
            <option value="More than a Week Ago">More than a Week Ago</option>
            <option value="More than a Month Ago">More than a Month Ago</option>
            <option value="More than 6 Months">More than 6 Months</option>
            <option value="More than a Year">More than a Year</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="ticketNo-desc">Ticket No (High→Low)</option>
            <option value="ticketNo-asc">Ticket No (Low→High)</option>
            <option value="client">Client Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* ─── TICKET LIST ─── */}
      {paginated.length === 0 ? (
        <div className="empty-state-enhanced">
          <div className="empty-illustration items">
            <i className="fas fa-ticket-alt"></i>
          </div>
          <h3>
            {hasActiveFilters ? 'No tickets match your filters' :
             activeTab === 'support' ? 'No support tickets yet' : 'No project tickets yet'}
          </h3>
          <p>
            {hasActiveFilters
              ? 'Try different filters or clear them to see all tickets.'
              : 'Create your first ticket to get started.'}
          </p>
          {hasActiveFilters ? (
            <button className="secondary-btn" onClick={clearFilters}>
              <i className="fas fa-times"></i> Clear filters
            </button>
          ) : (
            <button className="primary-btn" onClick={handleAdd}>
              <i className="fas fa-plus"></i> New Ticket
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="ticket-list">
            {paginated.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onView={handleEdit}
                onEdit={handleEdit}
                onDelete={setDeletingTicket}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemLabel="tickets"
            onPageChange={setPage}
          />
        </>
      )}

      <TicketModal
        show={showModal}
        ticket={editingTicket}
        defaultTaskType={activeTab}
        onClose={() => { setShowModal(false); setEditingTicket(null); }}
        onSave={handleSave}
      />

      <ConfirmModal
        show={!!deletingTicket}
        title="Delete Ticket?"
        message="This ticket will be permanently removed. This action cannot be undone."
        preview={deletingTicket ? `#${deletingTicket.ticketNo} — ${deletingTicket.subject}` : ''}
        confirmText="Delete Ticket"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingTicket(null)}
      />
    </section>
  );
}
