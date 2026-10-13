const DAY = 86400000;
export function reportEntry(row, kind, now = Date.now()) {
  const status = String(row.status || '').toLowerCase();
  const complete = kind === 'tasks' ? Boolean(row.done) : kind === 'meetings' ? Boolean(row.completed) : ['closed', 'completed', 'cancelled'].includes(status);
  const due = kind === 'tasks' ? row.due_date : kind === 'tickets' ? row.timeline : kind === 'items' ? row.next_check : null;
  // Date-only deadlines expire after the local calendar day ends.
  const dueTime = due && /^\d{4}-\d{2}-\d{2}$/.test(due) ? new Date(`${due}T23:59:59.999`).getTime() : Date.parse(due || '');
  const updates = [row.updated_at, row.created_at, kind === 'tickets' ? row.date_last_update : kind === 'items' ? row.last_check : null].map(value => Date.parse(value || '')).filter(Number.isFinite);
  const lastUpdate = updates.length ? Math.max(...updates) : null;
  return { ...row, kind, complete, overdue: !complete && Number.isFinite(dueTime) && dueTime < now,
    stale: !complete && kind !== 'meetings' && lastUpdate !== null && now - lastUpdate >= 5 * DAY,
    due: Number.isFinite(dueTime) ? due : null, lastUpdate,
    title: row.text || row.subject || row.title || row.ticket_no || 'Untitled',
    displayStatus: kind === 'tasks' ? (complete ? 'Completed' : row.kanban_status || 'Pending') : kind === 'meetings' ? (complete ? 'Completed' : 'Scheduled') : row.status || 'Pending' };
}
export function employeeEntries(profileId, collections, now = Date.now()) {
  return Object.entries(collections).flatMap(([kind, rows]) => rows.filter(row => row.user_id === profileId).map(row => reportEntry(row, kind, now)));
}
