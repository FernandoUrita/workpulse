import test from 'node:test';
import assert from 'node:assert/strict';
import { reportEntry, employeeEntries } from '../src/utils/employeeReport.js';
const now = new Date('2026-10-08T12:00:00').getTime();
test('date-only deadlines remain active through the due day', () => {
 assert.equal(reportEntry({ due_date: '2026-10-08' }, 'tasks', now).overdue, false);
 assert.equal(reportEntry({ due_date: '2026-10-07' }, 'tasks', now).overdue, true);
});
test('closed records suppress attention flags and malformed dates remain unknown', () => {
 assert.equal(reportEntry({ status: 'Closed', timeline: '2026-01-01', updated_at: '2026-01-01' }, 'tickets', now).stale, false);
 const row = reportEntry({ timeline: 'ASAP', updated_at: 'invalid' }, 'tickets', now);
 assert.equal(row.overdue, false); assert.equal(row.stale, false); assert.equal(row.due, null);
});
test('latest recorded update prevents false stale classification', () => {
 assert.equal(reportEntry({ updated_at: '2026-10-01', date_last_update: '2026-10-08' }, 'tickets', now).stale, false);
 assert.equal(reportEntry({ updated_at: '2026-10-01' }, 'tasks', now).stale, true);
});
test('employee breakdown uses record ownership and excludes other owners', () => {
 const rows = employeeEntries('a', { tasks: [{id:1,user_id:'a'},{id:2,user_id:'b',assignees:['a']}] }, now);
 assert.deepEqual(rows.map(row => row.id), [1]);
});
