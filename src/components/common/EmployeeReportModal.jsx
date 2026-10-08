import { useEffect, useMemo, useRef, useState } from 'react';
import { employeeEntries } from '../../utils/employeeReport.js';
import '../../styles/employee-report.css';

const KINDS = ['tasks', 'tickets', 'meetings', 'items'];
const dateText = value => value ? new Date(value).toLocaleDateString() : '—';
export default function EmployeeReportModal({ employee, collections, rangeLabel, now, onClose, onSend }) {
  const dialog = useRef(null);
  const [kind, setKind] = useState('tasks');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const entries = useMemo(() => employeeEntries(employee.id, collections, now), [employee.id, collections, now]);
  const rows = entries.filter(row => row.kind === kind && (filter === 'all' || (filter === 'pending' ? !row.complete : row[filter])) && `${row.title} ${row.client_name || ''} ${row.ref || ''} ${row.ticket_no || ''}`.toLowerCase().includes(search.toLowerCase()));
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const currentPage = Math.min(page, pages);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    return () => { document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  const count = test => entries.filter(test).length;
  return <div className="employee-report-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="employee-report-dialog" role="dialog" aria-modal="true" aria-labelledby="employee-report-title" tabIndex={-1} ref={dialog} onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
      if (event.key === 'Tab') {
        const nodes = [...dialog.current.querySelectorAll('button,input,select')].filter(node => !node.disabled);
        const first = nodes[0], last = nodes.at(-1);
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
      <header className="employee-report-header"><div><h3 id="employee-report-title">{employee.name || employee.username}</h3><p>@{employee.username} · {employee.role} · {rangeLabel}</p></div><button className="secondary-btn" aria-label="Close employee report" onClick={onClose}>×</button></header>
      <div className="employee-report-body"><p className="employee-report-note">Records owned by this employee, filtered by creation date. Shared assignments are not included. Stale means no recorded update for at least 5 days.</p>
        <div className="employee-report-stats">{[['Total records', entries.length], ['Pending / active', count(row => !row.complete)], ['Completed / closed', count(row => row.complete)], ['Overdue', count(row => row.overdue)], ['Stale', count(row => row.stale)]].map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
        <div className="employee-report-tabs" aria-label="Record categories">{KINDS.map(value => <button type="button" key={value} className={`secondary-btn ${kind === value ? 'active' : ''}`} aria-pressed={kind === value} onClick={() => { setKind(value); setPage(1); }}>{value} ({count(row => row.kind === value)})</button>)}</div>
        <div className="employee-report-tools"><input aria-label="Search employee records" placeholder="Search title, client or reference…" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /><select aria-label="Filter employee records" value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}><option value="all">All records</option><option value="pending">Pending / active</option><option value="complete">Completed / closed</option><option value="overdue">Overdue</option><option value="stale">Stale — 5+ days</option></select></div>
        <div className="employee-report-table"><table><thead><tr><th>Record</th><th>Status</th><th>Due / next check</th><th>Last update</th><th>Attention</th></tr></thead><tbody>{rows.slice((currentPage - 1) * 10, currentPage * 10).map(row => <tr key={`${row.kind}-${row.id}`}><td><strong>{row.title}</strong><small>{[row.ticket_no, row.client_name, row.ref].filter(Boolean).join(' · ')}</small></td><td>{row.displayStatus}</td><td>{dateText(row.due)}</td><td>{dateText(row.lastUpdate)}</td><td>{row.overdue && <span className="employee-report-flag overdue">Overdue</span>}{row.stale && <span className="employee-report-flag stale">Stale</span>}{!row.overdue && !row.stale && '—'}</td></tr>)}{!rows.length && <tr><td colSpan={5} className="employee-report-empty">No matching {kind} in this date range.</td></tr>}</tbody></table></div>
        <div className="employee-report-pagination"><span>{rows.length} records · Page {currentPage} of {pages}</span><button className="secondary-btn" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><button className="secondary-btn" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</button></div>
      </div><footer className="employee-report-footer"><button className="secondary-btn" onClick={onClose}>Close</button>{onSend && <button className="primary-btn" onClick={() => onSend(employee)}><i className="fas fa-paper-plane" aria-hidden="true" /> Send reminder</button>}</footer>
    </div>
  </div>;
}
