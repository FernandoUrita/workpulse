import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppData } from '../../context/AppDataContext.jsx';
import { formatDateTime } from '../../utils/helpers.js';

const ACTION_META = {
  created:           { icon: 'fa-plus-circle',    label: 'Created',         class: 'created' },
  updated:           { icon: 'fa-edit',           label: 'Updated',         class: 'updated' },
  completed:         { icon: 'fa-check-circle',   label: 'Completed',       class: 'completed' },
  reopened:          { icon: 'fa-undo',           label: 'Reopened',        class: 'reopened' },
  remark_added:      { icon: 'fa-comment',        label: 'Remark Added',    class: 'remark' },
  assignee_added:    { icon: 'fa-user-plus',      label: 'Assignee Added',  class: 'assignee-add' },
  assignee_removed:  { icon: 'fa-user-minus',     label: 'Assignee Removed',class: 'assignee-remove' },
};

const PAGE_SIZE = 20;

function getDateGroup(timestamp) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = startOfToday - 30 * 24 * 60 * 60 * 1000;

  if (timestamp >= startOfToday) return 'Today';
  if (timestamp >= startOfYesterday) return 'Yesterday';
  if (timestamp >= startOfWeek) return 'This Week';
  if (timestamp >= startOfMonth) return 'This Month';
  return 'Older';
}

const DATE_GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];

export default function ActivityPage() {
  const { tasks } = useAppData();
  const navigate = useNavigate();

  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allActivities = useMemo(() => {
    const list = [];
    tasks.forEach(task => {
      (task.auditLog || []).forEach(entry => {
        list.push({
          ...entry,
          entityType: 'task',
          entityId: task.id,
          entityTitle: task.text,
          path: `/tasks?open=${task.id}`,
        });
      });
    });
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [tasks]);

  const users = useMemo(() => {
    return Array.from(new Set(allActivities.map(a => a.user).filter(Boolean))).sort();
  }, [allActivities]);

  const filtered = useMemo(() => {
    let result = allActivities;
    if (actionFilter !== 'all') result = result.filter(a => a.action === actionFilter);
    if (userFilter !== 'all') result = result.filter(a => a.user === userFilter);
    if (dateFilter !== 'all') {
      const now = Date.now();
      const ranges = { today: 86400000, week: 604800000, month: 2592000000 };
      const range = ranges[dateFilter];
      if (range) result = result.filter(a => now - a.timestamp <= range);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(a =>
        (a.entityTitle || '').toLowerCase().includes(q) ||
        (a.user || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [allActivities, actionFilter, userFilter, dateFilter, search]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(a => {
      const group = getDateGroup(a.timestamp);
      if (!groups[group]) groups[group] = [];
      groups[group].push(a);
    });
    return DATE_GROUP_ORDER
      .filter(g => groups[g] && groups[g].length > 0)
      .map(g => [g, groups[g]]);
  }, [filtered]);

  const hasMore = filtered.length > visibleCount;

  const stats = useMemo(() => ({
    total: allActivities.length,
    filtered: filtered.length,
    users: users.length,
  }), [allActivities, filtered, users]);

  const handleActivityClick = (activity) => navigate(activity.path);

  const clearFilters = () => {
    setActionFilter('all');
    setUserFilter('all');
    setDateFilter('all');
    setSearch('');
    setVisibleCount(PAGE_SIZE);
  };

  const hasActiveFilters = actionFilter !== 'all' || userFilter !== 'all' || dateFilter !== 'all' || search.trim();

  let shownCount = 0;

  return (
    <section className="module">
      <div className="module-header">
        <h3><i className="fas fa-stream"></i> Activity Log</h3>
        <div className="module-actions">
          {hasActiveFilters && (
            <button className="secondary-btn" onClick={clearFilters}>
              <i className="fas fa-times"></i> Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="activity-stats">
        <div className="activity-stat">
          <i className="fas fa-stream"></i>
          <div><strong>{stats.total}</strong><span>Total activities</span></div>
        </div>
        <div className="activity-stat">
          <i className="fas fa-filter"></i>
          <div><strong>{stats.filtered}</strong><span>Showing</span></div>
        </div>
        <div className="activity-stat">
          <i className="fas fa-users"></i>
          <div><strong>{stats.users}</strong><span>Active users</span></div>
        </div>
      </div>

      <div className="activity-filters">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
          />
        </div>
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}>
          <option value="all">All Actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="completed">Completed</option>
          <option value="reopened">Reopened</option>
          <option value="remark_added">Remark Added</option>
          <option value="assignee_added">Assignee Added</option>
          <option value="assignee_removed">Assignee Removed</option>
        </select>
        <select value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}>
          <option value="all">All Users</option>
          {users.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}>
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state-enhanced">
          <div className="empty-illustration items">
            <i className="fas fa-stream"></i>
          </div>
          <h3>No activities found</h3>
          <p>{hasActiveFilters ? 'Try different filters.' : 'Activities will appear here.'}</p>
          {hasActiveFilters && (
            <button className="primary-btn" onClick={clearFilters}>
              <i className="fas fa-times"></i> Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="activity-feed">
          {grouped.map(([group, entries]) => {
            const visibleEntries = [];
            for (const entry of entries) {
              if (shownCount >= visibleCount) break;
              visibleEntries.push(entry);
              shownCount++;
            }
            if (visibleEntries.length === 0) return null;
            return (
              <div key={group} className="activity-group">
                <div className="activity-group-label">
                  <i className="fas fa-calendar-day"></i>
                  {group}
                  <span className="activity-group-count">{entries.length}</span>
                </div>
                {visibleEntries.map(entry => {
                  const meta = ACTION_META[entry.action] || { icon: 'fa-circle', label: entry.action, class: 'default' };
                  return (
                    <motion.button
                      key={entry.id}
                      type="button"
                      className="activity-card"
                      onClick={() => handleActivityClick(entry)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={`activity-card-icon ${meta.class}`}>
                        <i className={`fas ${meta.icon}`}></i>
                      </div>
                      <div className="activity-card-content">
                        <div className="activity-card-title">
                          <strong>{entry.user || 'system'}</strong>{' '}
                          <span className="activity-action-label">{meta.label.toLowerCase()}</span>{' '}
                          <span className="activity-entity">"{entry.entityTitle}"</span>
                        </div>
                        {entry.changes && (
                          <div className="activity-card-changes">
                            {Object.entries(entry.changes).map(([field, { from, to }]) => (
                              <div key={field} className="activity-change">
                                <span className="change-field">{field}</span>
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
                        <div className="activity-card-time">
                          <i className="fas fa-clock"></i>
                          {formatDateTime(entry.timestamp)}
                        </div>
                      </div>
                      <i className="fas fa-chevron-right activity-card-arrow"></i>
                    </motion.button>
                  );
                })}
              </div>
            );
          })}
          {hasMore && (
            <button
              type="button"
              className="load-more-btn"
              onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
            >
              <i className="fas fa-chevron-down"></i>
              Load more ({filtered.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </section>
  );
}
