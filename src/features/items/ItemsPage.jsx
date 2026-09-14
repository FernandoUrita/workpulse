import { useState, useMemo } from 'react';
import { useAppData } from '../../context/AppDataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ITEM_TYPE_CONFIG } from '../../utils/constants.js';
import ItemCard from './ItemCard.jsx';
import ItemModal from './ItemModal.jsx';
import ItemDetailModal from './ItemDetailModal.jsx';
import CheckinModal from './CheckinModal.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import Pagination from '../../components/common/Pagination.jsx';

const PER_PAGE = 9;

const TABS = [
  { id: 'all', label: 'All', icon: 'fa-layer-group' },
  { id: 'monitoring', label: 'Monitoring', icon: 'fa-server' },
  { id: 'project', label: 'Projects', icon: 'fa-briefcase' },
  { id: 'issue', label: 'Issues', icon: 'fa-bug' },
  { id: 'custom', label: 'Custom Requests', icon: 'fa-clipboard-list' },
];

export default function ItemsPage() {
  const { 
    items, 
    addItem, 
    updateItem, 
    deleteItem, 
    addCheckin 
  } = useAppData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [checkinItem, setCheckinItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // ─── FILTERING ──────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...items];

    if (activeTab !== 'all') {
      result = result.filter(i => i.type === activeTab);
    }

    if (statusFilter !== 'all') {
      result = result.filter(i => i.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
      result = result.filter(i => i.priority === priorityFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(i => {
        const haystack = [
          i.text || '',
          i.ref || '',
          i.notes || '',
          i.reporter || '',
          i.client || '',
          i.requestedBy || '',
          ...(i.tags || []),
        ].join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }

    return result.sort((a, b) => {
      if (sort === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sort === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sort === 'alpha') return (a.text || '').localeCompare(b.text || '');
      if (sort === 'priority') {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] || 4) - (order[b.priority] || 4);
      }
      if (sort === 'checkin') {
        if (!a.nextCheck) return 1;
        if (!b.nextCheck) return -1;
        return new Date(a.nextCheck) - new Date(b.nextCheck);
      }
      return 0;
    });
  }, [items, activeTab, statusFilter, priorityFilter, search, sort]);

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter(i => ['completed', 'resolved', 'closed'].includes(i.status)).length;
    const inProgress = items.filter(i => ['pending', 'in-progress'].includes(i.status)).length;
    const critical = items.filter(i => i.priority === 'critical' && !['completed', 'cancelled'].includes(i.status)).length;
    return { total, completed, inProgress, critical };
  }, [items]);

  const tabCounts = useMemo(() => ({
    all: items.length,
    monitoring: items.filter(i => i.type === 'monitoring').length,
    project: items.filter(i => i.type === 'project').length,
    issue: items.filter(i => i.type === 'issue').length,
    custom: items.filter(i => i.type === 'custom').length,
  }), [items]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = Math.min(page, totalPages) || 1;
  const start = (currentPage - 1) * PER_PAGE;
  const paginated = filtered.slice(start, start + PER_PAGE);

  // ─── HANDLERS ───────────────────────────────────
  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setDetailItem(null);
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSave = (data) => {
    if (editingItem) {
      updateItem(editingItem.id, data);
    } else {
      addItem(data);
    }
    setShowModal(false);
    setEditingItem(null);
    setPage(1);
  };

  const handleDelete = (item) => {
    setDetailItem(null);
    setDeletingItem(item);
  };

  const confirmDelete = () => {
    if (deletingItem) {
      deleteItem(deletingItem.id);
      showToast('success', 'Item Deleted', `"${deletingItem.text}" has been removed.`);
      setDeletingItem(null);
    }
  };

  const handleCheckin = (item) => {
    setDetailItem(null);
    setCheckinItem(item);
  };

  const handleSaveCheckin = (id, note, nextDate) => {
    addCheckin(id, note, nextDate);
    setCheckinItem(null);
  };

  // ─── EMPTY MESSAGE ─────────────────────────────
  const emptyMessage = useMemo(() => {
    if (search) return 'No items match your search.';
    if (statusFilter !== 'all' || priorityFilter !== 'all') return 'No items match your filters.';
    const map = {
      all: 'Start tracking your projects, monitoring, issues, or custom requests.',
      monitoring: 'Add your first hypercare/client monitoring item.',
      project: 'Add a project to track its progress.',
      issue: 'Log an issue or incident to track resolution.',
      custom: 'Track special requests from your clients here.',
    };
    return map[activeTab] || map.all;
  }, [search, statusFilter, priorityFilter, activeTab]);

  return (
    <section className="module">
      <div className="module-header">
        <h3><i className="fas fa-boxes-stacked"></i> Items Tracker</h3>
        <div className="module-actions">
          <button className="primary-btn" onClick={handleAdd}>
            <i className="fas fa-plus"></i> Add Item
          </button>
        </div>
      </div>

      {/* Type Tabs */}
      <div className="item-type-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`item-type-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setPage(1); }}
          >
            <i className={`fas ${tab.icon}`}></i>
            <span>{tab.label}</span>
            <span className="tab-count">{tabCounts[tab.id]}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="item-stats-grid">
        <div className="item-stat-card">
          <div className="item-stat-icon blue"><i className="fas fa-cubes"></i></div>
          <div className="item-stat-info">
            <h4>{stats.total}</h4>
            <p>Total Items</p>
          </div>
        </div>
        <div className="item-stat-card">
          <div className="item-stat-icon green"><i className="fas fa-circle-check"></i></div>
          <div className="item-stat-info">
            <h4>{stats.completed}</h4>
            <p>Completed</p>
          </div>
        </div>
        <div className="item-stat-card">
          <div className="item-stat-icon yellow"><i className="fas fa-hourglass-half"></i></div>
          <div className="item-stat-info">
            <h4>{stats.inProgress}</h4>
            <p>In Progress</p>
          </div>
        </div>
        <div className="item-stat-card">
          <div className="item-stat-icon red"><i className="fas fa-triangle-exclamation"></i></div>
          <div className="item-stat-info">
            <h4>{stats.critical}</h4>
            <p>Critical</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search items by title, client, or tags..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="filter-group">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="in-progress">🟡 In Progress</option>
            <option value="for-review">👀 For Review</option>
            <option value="completed">✅ Completed</option>
            <option value="on-hold">⏸️ On Hold</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>
          <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
            <option value="all">All Priority</option>
            <option value="critical">🚨 Critical</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Priority</option>
            <option value="alpha">A-Z</option>
            <option value="checkin">Next Check-in</option>
          </select>
        </div>
      </div>

      {/* Items List */}
      {paginated.length === 0 ? (
        <div className="empty-state-enhanced">
          <div className="empty-illustration">
            <i className="fas fa-boxes-stacked"></i>
          </div>
          <h3>No items found</h3>
          <p>{emptyMessage}</p>
          <button className="primary-btn" onClick={handleAdd}>
            <i className="fas fa-plus"></i> Add Item
          </button>
        </div>
      ) : (
        <>
          <div className="items-grid">
            {paginated.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onView={setDetailItem}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCheckin={handleCheckin}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemLabel="items"
            onPageChange={setPage}
          />
        </>
      )}

      {/* Modals */}
      <ItemModal
        show={showModal}
        item={editingItem}
        onClose={() => { setShowModal(false); setEditingItem(null); }}
        onSave={handleSave}
      />

      <ItemDetailModal
        show={!!detailItem}
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCheckin={handleCheckin}
      />

      <CheckinModal
        show={!!checkinItem}
        item={checkinItem}
        onClose={() => setCheckinItem(null)}
        onSave={handleSaveCheckin}
      />

      <ConfirmModal
        show={!!deletingItem}
        title="Delete Item?"
        message="This item and its check-in history will be permanently removed."
        preview={deletingItem?.text}
        confirmText="Delete Item"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </section>
  );
}
