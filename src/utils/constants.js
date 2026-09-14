// ─── ITEM TYPES ─────────────────────────────────
export const ITEM_TYPE_CONFIG = {
  monitoring: { label: 'Monitoring', icon: 'fa-server', color: '#2563eb' },
  project: { label: 'Project', icon: 'fa-briefcase', color: '#7c3aed' },
  issue: { label: 'Issue', icon: 'fa-bug', color: '#dc2626' },
  custom: { label: 'Custom Request', icon: 'fa-clipboard-list', color: '#f97316' },
};

export const ITEM_STATUS_LABELS = {
  pending: { label: 'Pending', icon: 'fa-hourglass-start', class: 'status-in-progress' },
  'in-progress': { label: 'In Progress', icon: 'fa-spinner', class: 'status-in-progress' },
  'for-review': { label: 'For Review', icon: 'fa-eye', class: 'status-resolved' },
  completed: { label: 'Completed', icon: 'fa-check', class: 'status-active' },
  'on-hold': { label: 'On Hold', icon: 'fa-pause', class: 'status-on-hold' },
  cancelled: { label: 'Cancelled', icon: 'fa-times', class: 'status-closed' },
};

export const ITEM_PRIORITY_LABELS = {
  critical: { label: 'Critical', emoji: '🚨' },
  high: { label: 'High', emoji: '🔴' },
  medium: { label: 'Medium', emoji: '🟡' },
  low: { label: 'Low', emoji: '🟢' },
};

export const TASK_PRIORITY_LABELS = {
  high: { label: 'High', emoji: '🔴' },
  medium: { label: 'Medium', emoji: '🟡' },
  low: { label: 'Low', emoji: '🟢' },
};

export const TASK_CATEGORY_LABELS = {
  work: '💼 Work',
  personal: '🏠 Personal',
  urgent: '🚨 Urgent',
  learning: '📚 Learning',
  health: '💪 Health',
  finance: '💰 Finance',
};

export const PLATFORM_LABELS = {
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
  gmeet: 'Google Meet',
  viber: 'Viber Call',
  anydesk: 'AnyDesk',
  teamviewer: 'TeamViewer',
  onsite: 'On-site',
};

export const PLATFORM_ICONS = {
  zoom: '💻',
  teams: '💼',
  gmeet: '📹',
  viber: '📱',
  anydesk: '🖥️',
  teamviewer: '🖥️',
  onsite: '🏢',
};

// ─── MEETING PLATFORMS ──────────────────────────
export const MEETING_PLATFORMS = [
  { value: 'zoom', label: 'Zoom', icon: '💻' },
  { value: 'teams', label: 'Microsoft Teams', icon: '💼' },
  { value: 'gmeet', label: 'Google Meet', icon: '📹' },
  { value: 'viber', label: 'Viber Call', icon: '📱' },
  { value: 'anydesk', label: 'AnyDesk', icon: '🖥️' },
  { value: 'teamviewer', label: 'TeamViewer', icon: '🖥️' },
];