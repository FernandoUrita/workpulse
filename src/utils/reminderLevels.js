export const REMINDER_LEVELS = {
  urgent: { label: 'Urgent', severity: 'critical', color: '#ef4444' },
  month: { label: 'Overdue more than a month', severity: 'warning', color: '#f97316' },
  week: { label: 'Overdue more than a week', severity: 'warning', color: '#eab308' },
  daily: { label: 'Daily / gentle reminder', severity: 'info', color: '#3b82f6' },
  normal: { label: 'Normal reminder', severity: 'info', color: '#10b981' },
};
export function reminderLevel(row) {
  if (Object.hasOwn(REMINDER_LEVELS, row.reminder_level)) return row.reminder_level;
  return row.severity === 'critical' ? 'urgent' : row.severity === 'warning' ? 'week' : 'daily';
}
