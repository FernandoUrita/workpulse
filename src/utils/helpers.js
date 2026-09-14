// ─── ESCAPE HTML ────────────────────────────────
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── DATE HELPERS ───────────────────────────────
export function isOverdue(dueDate) {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  return due < today;
}

export function isDueToday(dueDate) {
  if (!dueDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dueDate === today;
}

export function isDueSoon(dueDate) {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
}

export function formatDate(date, options = {}) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
  return d.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function getWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

// ─── TASK HELPERS ───────────────────────────────
export function getDateFilteredTasks(tasks, mode, activeDate) {
  if (mode === 'all') return tasks;

  if (mode === 'week') {
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate + 'T00:00:00');
      return due >= monday && due <= sunday;
    });
  }

  return tasks.filter(t => t.dueDate === activeDate);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.done).length;
  const pending = tasks.filter(t => !t.done).length;
  const overdue = tasks.filter(t => !t.done && t.dueDate && isOverdue(t.dueDate)).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { total, completed, pending, overdue, percent };
}

// ─── MEETING HELPERS ────────────────────────────
export function isMeetingPast(meeting) {
  if (!meeting.date) return false;
  const meetingDate = new Date(`${meeting.date}T${meeting.time || '00:00'}`);
  return meetingDate < new Date();
}

export function generateMomFromTemplate(meeting, template) {
  const platformLabels = {
    zoom: 'Zoom',
    teams: 'Microsoft Teams',
    gmeet: 'Google Meet',
    viber: 'Viber Call',
    anydesk: 'AnyDesk',
    teamviewer: 'TeamViewer',
    onsite: 'On-site',
  };

  const attendeesList = meeting.attendees?.length > 0
    ? meeting.attendees.map(a => `• ${a}`).join('\n')
    : 'No attendees listed';

  const agendaList = meeting.agenda?.length > 0
    ? meeting.agenda.map((a, i) => `${i + 1}. ${a}`).join('\n')
    : 'No agenda items';

  const typeLabel = meeting.type === 'remote' ? '💻 Remote' : '🏢 Physical';
  const platformLabel = meeting.platform 
    ? (platformLabels[meeting.platform] || meeting.platform) 
    : 'N/A';

  let credsString = 'N/A';
  if (meeting.anydeskId) {
    credsString = `AnyDesk ID: ${meeting.anydeskId}${meeting.anydeskPassword ? ' | Password: ' + meeting.anydeskPassword : ''}`;
  } else if (meeting.teamviewerId) {
    credsString = `TeamViewer ID: ${meeting.teamviewerId}${meeting.teamviewerPassword ? ' | Password: ' + meeting.teamviewerPassword : ''}`;
  }

  return template
    .replace(/{title}/g, meeting.title || 'N/A')
    .replace(/{date}/g, meeting.date || 'N/A')
    .replace(/{time}/g, meeting.time || 'N/A')
    .replace(/{type}/g, typeLabel)
    .replace(/{platform}/g, platformLabel)
    .replace(/{location}/g, meeting.location || 'N/A')
    .replace(/{link}/g, meeting.link || 'N/A')
    .replace(/{credentials}/g, credsString)
    .replace(/{attendees}/g, attendeesList)
    .replace(/{agenda}/g, agendaList);
}