// ─── AGING COMPUTATION ──────────────────────────
export function computeAging(dateCreated) {
  if (!dateCreated) return '';

  const created = new Date(dateCreated);
  if (isNaN(created.getTime())) return '';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfCreated = new Date(created.getFullYear(), created.getMonth(), created.getDate());

  const diffDays = Math.floor((startOfToday - startOfCreated) / (1000 * 60 * 60 * 24));
  const diffMonths = (now.getFullYear() - created.getFullYear()) * 12
                    + (now.getMonth() - created.getMonth());

  if (diffMonths >= 12) return 'More than a Year';
  if (diffMonths >= 6) return 'More than 6 Months';
  if (diffMonths >= 1) return 'More than a Month Ago';
  if (diffDays > 7) return 'More than a Week Ago';
  if (diffDays >= 4) return '4-7 Days';
  if (diffDays >= 1) return '1-3 Days';
  return 'Today';
}

// ─── TICKET NO. GENERATION ──────────────────────
export function generateNextTicketNo(tickets) {
  if (!tickets || tickets.length === 0) return '10001';
  const numbers = tickets
    .map(t => parseInt(t.ticketNo, 10))
    .filter(n => !isNaN(n));
  if (numbers.length === 0) return '10001';
  const max = Math.max(...numbers);
  return String(max + 1);
}

// ─── DROPDOWN OPTIONS ───────────────────────────
export const TICKET_STATUSES = [
  { value: 'Open', label: '🟢 Open' },
  { value: 'Hypercare', label: '🔥 Hypercare' },
  { value: 'In Progress', label: '🟡 In Progress' },
  { value: 'Closed', label: '✅ Closed' },
  { value: 'On Hold', label: '⏸️ On Hold' },
];

export const TICKET_CATEGORIES = [
  { value: 'Explanation', label: '💬 Explanation' },
  { value: 'Bug', label: '🐛 Bug' },
  { value: 'Enhancement', label: '✨ Enhancement' },
  { value: 'Customization', label: '🔧 Customization' },
];

export const TICKET_PENDING_TO = [
  { value: 'Client', label: '👤 Client' },
  { value: 'Jeonsoft', label: '🏢 Jeonsoft' },
  { value: 'Client, Jeonsoft', label: '👤🏢 Client, Jeonsoft' },
  { value: 'Jeonsoft, Client', label: '🏢👤 Jeonsoft, Client' },
];

export const TICKET_PRIORITIES = [
  { value: 'Critical', label: '🚨 Critical', emoji: '🚨' },
  { value: 'High', label: '🔴 High', emoji: '🔴' },
  { value: 'Medium', label: '🟡 Medium', emoji: '🟡' },
  { value: 'Low', label: '🟢 Low', emoji: '🟢' },
];

export const TICKET_TASK_TYPES = [
  { value: 'support', label: 'Support Task', icon: 'fa-headset' },
  { value: 'project', label: 'Project Task', icon: 'fa-briefcase' },
];

// ─── STATUS COLOR CLASS ─────────────────────────
export function getStatusClass(status) {
  const map = {
    'Open': 'status-open',
    'Hypercare': 'status-hypercare',
    'In Progress': 'status-in-progress',
    'Closed': 'status-closed',
    'On Hold': 'status-on-hold',
  };
  return map[status] || 'status-default';
}

export function getPriorityClass(priority) {
  const map = {
    'Critical': 'priority-critical',
    'High': 'priority-high',
    'Medium': 'priority-medium',
    'Low': 'priority-low',
  };
  return map[priority] || 'priority-medium';
}
