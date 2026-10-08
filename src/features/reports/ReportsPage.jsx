import UrgentAttentionButton from '../../components/common/UrgentAttentionButton.jsx';
import EmployeeReportModal from '../../components/common/EmployeeReportModal.jsx';
import SendNotificationModal from '../../components/common/SendNotificationModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMemo, useState } from 'react';
import { useAllData } from '../../hooks/useAllData.js';
import { stringifyCSV, downloadCSV } from '../../utils/csvHelpers.js';
import { useToast } from '../../context/ToastContext.jsx';

const DATE_RANGES = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Last 24 hours' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'month', label: 'Last 30 days' },
];

const RANGE_MS = {
  today: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

export default function ReportsPage() {
  const { tasks, tickets, meetings, items, profiles, loading, error } = useAllData();
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const canSend = ['head', 'admin'].includes(currentUser?.role);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [reportNow, setReportNow] = useState(() => Date.now());
  const [dateRange, setDateRange] = useState('all');

  const [filteredTasks, filteredTickets, filteredMeetings, filteredItems] = useMemo(() => {
    const cutoff = reportNow - (RANGE_MS[dateRange] || 0);
    const filter = list => dateRange === 'all' ? list : list.filter(row => Date.parse(row.created_at || '') >= cutoff);
    return [tasks, tickets, meetings, items].map(filter);
  }, [tasks, tickets, meetings, items, dateRange, reportNow]);

  const summary = useMemo(() => ({
    tasks: {
      total: filteredTasks.length,
      completed: filteredTasks.filter(t => t.done).length,
      pending: filteredTasks.filter(t => !t.done).length,
    },
    tickets: {
      total: filteredTickets.length,
      open: filteredTickets.filter(t => t.status === 'Open').length,
      closed: filteredTickets.filter(t => t.status === 'Closed').length,
    },
    meetings: {
      total: filteredMeetings.length,
      completed: filteredMeetings.filter(m => m.completed).length,
    },
    items: {
      total: filteredItems.length,
      active: filteredItems.filter(i => i.status !== 'completed' && i.status !== 'cancelled').length,
    },
  }), [filteredTasks, filteredTickets, filteredMeetings, filteredItems]);

  const employeeStats = useMemo(() => {
    return profiles.map(profile => {
      const userTasks = filteredTasks.filter(t => t.user_id === profile.id);
      const userTickets = filteredTickets.filter(t => t.user_id === profile.id);
      const userMeetings = filteredMeetings.filter(m => m.user_id === profile.id);
      const userItems = filteredItems.filter(i => i.user_id === profile.id);

      return {
        ...profile,
        tasks: {
          total: userTasks.length,
          completed: userTasks.filter(t => t.done).length,
        },
        tickets: {
          total: userTickets.length,
          open: userTickets.filter(t => t.status === 'Open').length,
        },
        meetings: { total: userMeetings.length },
        items: { total: userItems.length },
        totalActivity: userTasks.length + userTickets.length + userMeetings.length + userItems.length,
      };
    }).sort((a, b) => b.totalActivity - a.totalActivity);
  }, [profiles, filteredTasks, filteredTickets, filteredMeetings, filteredItems]);

  const maxActivity = Math.max(...employeeStats.map(e => e.totalActivity), 1);

  const handleExport = () => {
    if (employeeStats.length === 0) {
      showToast('warning', 'Nothing to Export', 'No data available.');
      return;
    }

    const headers = [
      'Name', 'Username', 'Role',
      'Tasks Total', 'Tasks Completed',
      'Tickets Total', 'Tickets Open',
      'Meetings Total', 'Items Total', 'Total Activity',
    ];

    const rows = employeeStats.map(e => ({
      'Name': e.name || '',
      'Username': e.username || '',
      'Role': e.role || '',
      'Tasks Total': e.tasks.total,
      'Tasks Completed': e.tasks.completed,
      'Tickets Total': e.tickets.total,
      'Tickets Open': e.tickets.open,
      'Meetings Total': e.meetings.total,
      'Items Total': e.items.total,
      'Total Activity': e.totalActivity,
    }));

    const csv = stringifyCSV(headers, rows);
    const today = new Date().toISOString().slice(0, 10);
    downloadCSV(`workpulse-reports-${dateRange}-${today}.csv`, csv);
    showToast('success', 'Export Complete', `${employeeStats.length} employee(s) exported.`);
  };

  if (loading) {
    return (
      <section className="module">
        <div className="module-header">
          <div className="module-heading"><h3><i className="fas fa-chart-line"></i> Reports</h3><p className="module-description">Review team workload and send focused reminders.</p></div>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
          <p>Loading reports...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="module">
        <div className="module-header">
          <h3><i className="fas fa-chart-line"></i> Reports</h3>
        </div>
        <div className="empty-state-enhanced">
          <div className="empty-illustration items">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Error loading reports</h3>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="module">
      <div className="module-header">
        <h3><i className="fas fa-chart-line"></i> Reports</h3>
        <div className="module-actions">
          <button className="secondary-btn" onClick={handleExport}>
            <i className="fas fa-file-export"></i> Export CSV
          </button>
        </div>
      </div>

      <div className="reports-filters">
        {DATE_RANGES.map(r => (
          <button
            key={r.id}
            type="button"
            className={`reports-filter-chip ${dateRange === r.id ? 'active' : ''}`}
            onClick={() => { setReportNow(Date.now()); setDateRange(r.id); }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="reports-summary">
        <div className="reports-stat-card">
          <div className="reports-stat-icon blue"><i className="fas fa-tasks"></i></div>
          <div className="reports-stat-info">
            <h4>{summary.tasks.total}</h4>
            <p>Total Tasks</p>
            <div className="reports-stat-sub">
              <span className="sub-done">✓ {summary.tasks.completed}</span>
              <span className="sub-pending">⏳ {summary.tasks.pending}</span>
            </div>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon purple"><i className="fas fa-ticket-alt"></i></div>
          <div className="reports-stat-info">
            <h4>{summary.tickets.total}</h4>
            <p>Total Tickets</p>
            <div className="reports-stat-sub">
              <span className="sub-open">🟢 {summary.tickets.open}</span>
              <span className="sub-closed">✅ {summary.tickets.closed}</span>
            </div>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon green"><i className="fas fa-calendar-alt"></i></div>
          <div className="reports-stat-info">
            <h4>{summary.meetings.total}</h4>
            <p>Total Meetings</p>
            <div className="reports-stat-sub">
              <span className="sub-done">✓ {summary.meetings.completed}</span>
            </div>
          </div>
        </div>
        <div className="reports-stat-card">
          <div className="reports-stat-icon orange"><i className="fas fa-box"></i></div>
          <div className="reports-stat-info">
            <h4>{summary.items.total}</h4>
            <p>Total Items</p>
            <div className="reports-stat-sub">
              <span className="sub-pending">⏳ {summary.items.active}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="reports-section">
        <h4 className="reports-section-title">
          <i className="fas fa-users"></i> Per-Employee Breakdown
        </h4>

        {employeeStats.length === 0 ? (
          <div className="empty-state-enhanced">
            <div className="empty-illustration items">
              <i className="fas fa-users"></i>
            </div>
            <h3>No employee data</h3>
            <p>No activity in this date range.</p>
          </div>
        ) : (
          <div className="reports-table-wrapper">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Tasks</th>
                  <th>Tickets</th>
                  <th>Meetings</th>
                  <th>Items</th>
                  <th>Activity</th>
                  {canSend && <th>Reminder</th>}
                </tr>
              </thead>
              <tbody>
                {employeeStats.map(e => (
                  <tr key={e.id} className="reports-employee-row" onClick={() => setSelectedEmployeeId(e.id)}>
                    <td>
                      <div className="reports-user-cell">
                        <i className="fas fa-user-circle"></i>
                        <div>
                          <button className="reports-employee-open" type="button" aria-label={`View report for ${e.name || e.username}`} onClick={event => { event.stopPropagation(); setSelectedEmployeeId(e.id); }}><strong>{e.name || e.username}</strong></button>
                          <span>@{e.username}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge role-${e.role}`}>
                        {e.role}
                      </span>
                    </td>
                    <td>
                      <span className="cell-stat">
                        <strong>{e.tasks.total}</strong>
                        <small>✓ {e.tasks.completed}</small>
                      </span>
                    </td>
                    <td>
                      <span className="cell-stat">
                        <strong>{e.tickets.total}</strong>
                        <small>🟢 {e.tickets.open}</small>
                      </span>
                    </td>
                    <td><strong>{e.meetings.total}</strong></td>
                    <td><strong>{e.items.total}</strong></td>
                    <td>
                      <div className="activity-bar-wrapper">
                        <div
                          className="activity-bar"
                          style={{ width: `${(e.totalActivity / maxActivity) * 100}%` }}
                        />
                        <span className="activity-bar-label">{e.totalActivity}</span>
                      </div>
                    </td>
                    {canSend && <td><div className="reports-reminder-actions"><UrgentAttentionButton employee={e} /><button type="button" className="btn" title="Send notification" aria-label={`Send reminder to ${e.name || e.username}`} onClick={event => { event.stopPropagation(); setRecipient(e); }}><i className="fas fa-paper-plane" aria-hidden="true"></i></button></div></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    {selectedEmployeeId && profiles.find(profile => profile.id === selectedEmployeeId) && <EmployeeReportModal key={selectedEmployeeId} now={reportNow} employee={profiles.find(profile => profile.id === selectedEmployeeId)} collections={{ tasks: filteredTasks, tickets: filteredTickets, meetings: filteredMeetings, items: filteredItems }} rangeLabel={DATE_RANGES.find(range => range.id === dateRange).label} onClose={() => setSelectedEmployeeId(null)} onSend={canSend ? employee => { setSelectedEmployeeId(null); setRecipient(employee); } : null} />}
    {recipient && <SendNotificationModal key={recipient.id} recipient={recipient} onClose={() => setRecipient(null)} />}
    </section>
  );
}
