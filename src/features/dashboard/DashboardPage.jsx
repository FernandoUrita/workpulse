import { useAppData } from '../../context/AppDataContext.jsx';
import { escapeHtml, formatDate } from '../../utils/helpers.js';

export default function DashboardPage() {
  const { tasks, meetings, items } = useAppData();

  const completed = tasks.filter(t => t.done).length;
  const totalTasks = tasks.length;
  const pending = totalTasks - completed;
  const percentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  // Progress ring math
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Upcoming meetings (not completed, future date)
  const upcomingMeetings = meetings
    .filter(m => {
      if (m.completed) return false;
      if (!m.date) return false;
      const meetingDate = new Date(`${m.date}T${m.time || '00:00'}`);
      return meetingDate > new Date();
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateA - dateB;
    })
    .slice(0, 5);

  // Recent activities
  const activities = [];
  
  [...tasks].reverse().slice(0, 5).forEach(t => {
    activities.push({
      id: `task-${t.id}`,
      type: 'task',
      icon: 'fa-tasks',
      text: `Added task: "${t.text}"`,
      timestamp: t.createdAt,
    });
  });

  [...meetings].reverse().slice(0, 5).forEach(m => {
    activities.push({
      id: `meeting-${m.id}`,
      type: 'meeting',
      icon: 'fa-calendar-alt',
      text: `Scheduled meeting: "${m.title}"`,
      timestamp: m.createdAt,
    });
  });

  [...items].reverse().slice(0, 5).forEach(i => {
    activities.push({
      id: `item-${i.id}`,
      type: 'item',
      icon: 'fa-box',
      text: `Added item: "${i.text}"`,
      timestamp: i.createdAt,
    });
  });

  const recentActivities = activities
    .filter(a => a.timestamp)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8);

  return (
    <section className="module">
      {/* ─── STAT CARDS ──────────────────────── */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><i className="fas fa-tasks"></i></div>
          <div className="stat-info">
            <h3>{totalTasks}</h3>
            <p>Total Tasks</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><i className="fas fa-calendar-check"></i></div>
          <div className="stat-info">
            <h3>{meetings.length}</h3>
            <p>Meetings</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><i className="fas fa-box"></i></div>
          <div className="stat-info">
            <h3>{items.length}</h3>
            <p>Items</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><i className="fas fa-check-circle"></i></div>
          <div className="stat-info">
            <h3>{completed}</h3>
            <p>Completed Tasks</p>
          </div>
        </div>
      </div>

      {/* ─── CHARTS ROW ──────────────────────── */}
      <div className="charts-row">
        {/* Progress Ring */}
        <div className="chart-card">
          <h4><i className="fas fa-chart-pie"></i> Task Progress</h4>
          <div className="progress-ring">
            <div className="ring-container">
              <svg viewBox="0 0 120 120" className="ring-svg">
                <circle cx="60" cy="60" r={radius} className="ring-bg" />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="ring-progress"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="ring-label">
                <span>{percentage}%</span>
                <small>Complete</small>
              </div>
            </div>
          </div>
          <div className="progress-stats">
            <div className="progress-stat">
              <span className="dot done"></span>
              <span>Done: <strong>{completed}</strong></span>
            </div>
            <div className="progress-stat">
              <span className="dot pending"></span>
              <span>Pending: <strong>{pending}</strong></span>
            </div>
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="chart-card">
          <h4><i className="fas fa-calendar-week"></i> Upcoming Meetings</h4>
          <div className="upcoming-meetings-list">
            {upcomingMeetings.length === 0 ? (
              <p className="empty-msg">No upcoming meetings</p>
            ) : (
              upcomingMeetings.map(m => (
                <div key={m.id} className="upcoming-meeting-item">
                  <div className="meeting-info">
                    <span className="title">{escapeHtml(m.title)}</span>
                    <span className="meta">
                      {m.date} {m.time || ''} • {m.attendees?.length || 0} attendees
                    </span>
                  </div>
                  <span className="meeting-time">{m.time || 'TBD'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── RECENT ACTIVITY ─────────────────── */}
      <div className="recent-activity">
        <h4><i className="fas fa-clock"></i> Recent Activity</h4>
        {recentActivities.length === 0 ? (
          <p className="empty-msg">No recent activity</p>
        ) : (
          recentActivities.map(a => (
            <div key={a.id} className="activity-item">
              <div className={`activity-icon ${a.type}`}>
                <i className={`fas ${a.icon}`}></i>
              </div>
              <div className="activity-content">
                <div className="text">{escapeHtml(a.text)}</div>
                <div className="time">
                  {new Date(a.timestamp).toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
