import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../styles/admin-panel.css';

export default function UsersPage() {
 const { currentUser } = useAuth();
 const [users, setUsers] = useState([]), [audit, setAudit] = useState([]);
 const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
 const [error, setError] = useState(''), [message, setMessage] = useState('');
 const [tab, setTab] = useState('users'), [search, setSearch] = useState(''), [role, setRole] = useState('all'), [page, setPage] = useState(1);
 const [editor, setEditor] = useState(null);
 const alive = useRef(true);
 const load = useCallback(async () => {
  if (currentUser?.role !== 'admin') return;
  setLoading(true); setError('');
  const [u, a] = await Promise.all([
   supabase.from('profiles').select('id,name,username,email,role,is_active,created_at').order('name'),
   supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(200),
  ]);
  if (!alive.current) return;
  if (u.error || a.error) setError((u.error || a.error).message);
  else { setUsers(u.data || []); setAudit(a.data || []); }
  setLoading(false);
 }, [currentUser?.role]);
 useEffect(() => { alive.current = true; const timer = setTimeout(() => void load(), 0); return () => { alive.current = false; clearTimeout(timer); }; }, [load]);
 if (currentUser?.role !== 'admin') return <p>Admin access required.</p>;
 const filtered = users.filter(user => (role === 'all' || user.role === role) && `${user.name} ${user.username} ${user.email}`.toLowerCase().includes(search.toLowerCase()));
 const pages = Math.max(1, Math.ceil(filtered.length / 15)), currentPage = Math.min(page, pages);
 const nameOf = id => users.find(user => user.id === id)?.name || id || 'System';
 const save = async form => {
  setBusy(true); setError(''); setMessage('');
  try {
   const { error } = await supabase.rpc('admin_save_user', { p_id: form.id, p_name: form.name, p_username: form.username, p_role: form.role, p_active: form.is_active });
   if (error) throw error;
   if (alive.current) setMessage('User updated. Access changes apply to subsequent data requests.');
   if (alive.current) { setEditor(null); await load(); }
  } catch (error) { if (alive.current) setError(error.message); }
  finally { if (alive.current) setBusy(false); }
 };
 return <section className="module admin-panel"><div className="module-header"><div className="module-heading"><h3><i className="fas fa-users-cog" /> Users & access</h3><p className="module-description">Manage team access and review profile changes.</p></div><div className="module-actions"><button className="secondary-btn" disabled={busy || loading} onClick={load}>Refresh</button></div></div>
  <p className="admin-note">New accounts are created through the login/register page. Click Refresh after registration. Deactivate an account to remove access while keeping its work history. Your own access is managed by another admin.</p>
  <div className="admin-tabs"><button className="secondary-btn" aria-pressed={tab === 'users'} onClick={() => setTab('users')}>Users ({users.length})</button><button className="secondary-btn" aria-pressed={tab === 'audit'} onClick={() => setTab('audit')}>Audit log</button></div>
  {error && <p className="admin-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
  {loading ? <p role="status">Loading admin data…</p> : tab === 'users' ? <><div className="admin-tools"><input aria-label="Search users" placeholder="Search name, username or email" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /><select aria-label="Filter role" value={role} onChange={event => { setRole(event.target.value); setPage(1); }}><option value="all">All roles</option>{['employee','head','admin'].map(value => <option key={value}>{value}</option>)}</select></div><div className="admin-table"><table><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Access</th><th>Action</th></tr></thead><tbody>{filtered.slice((currentPage - 1) * 15,currentPage * 15).map(user => <tr key={user.id}><td><strong>{user.name}</strong><small>@{user.username}</small></td><td>{user.email || '—'}</td><td><span className={`role-badge role-${user.role}`}>{user.role}</span></td><td>{user.is_active ? 'Active' : 'Inactive'}</td><td><button className="secondary-btn" disabled={busy || user.id === currentUser.id} onClick={() => { setError(''); setEditor({ ...user }); }}>{user.id === currentUser.id ? 'Your account' : 'Edit access'}</button></td></tr>)}{!filtered.length && <tr><td colSpan={5}>No matching users.</td></tr>}</tbody></table></div><div className="admin-tools"><span>{filtered.length} users · Page {currentPage} of {pages}</span><button className="secondary-btn" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><button className="secondary-btn" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</button></div></> : <><p className="admin-note">Latest 200 events. Times use your browser timezone. Audit details contain profile/access changes, never passwords.</p><div className="admin-table"><table><thead><tr><th>Time</th><th>Actor</th><th>Target</th><th>Action / changes</th></tr></thead><tbody>{audit.map(event => <tr key={event.id}><td>{new Date(event.created_at).toLocaleString()}</td><td>{nameOf(event.actor_id)}</td><td>{nameOf(event.target_id)}</td><td>{event.action}<details><summary>View changes</summary><pre>{JSON.stringify({ before: event.before_data, after: event.after_data },null,2)}</pre></details></td></tr>)}{!audit.length && <tr><td colSpan={4}>No audit events yet.</td></tr>}</tbody></table></div></>}
  {editor && <UserEditor key={editor.id} initial={editor} busy={busy} error={error} onClose={() => setEditor(null)} onSave={save} />}
 </section>;
}
function UserEditor({ initial, busy, error, onClose, onSave }) {
 const [form,setForm] = useState(initial), [confirmed,setConfirmed] = useState(false);
 const dialog = useRef(null);
 useEffect(() => { const previous = document.activeElement; const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; dialog.current?.focus(); return () => { document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); }; }, []);
 const accessChanged = form.id && (form.role !== initial.role || form.is_active !== initial.is_active);
 const change = event => { setConfirmed(false); setForm(prev => ({ ...prev, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value })); };
 return <div className="admin-backdrop" onClick={event => { if (!busy && event.target === event.currentTarget) onClose(); }}><form className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-editor-title" tabIndex={-1} ref={dialog} onSubmit={event => { event.preventDefault(); if (!busy) onSave(form); }} onKeyDown={event => {
  if (event.key === 'Escape' && !busy) onClose();
  if (event.key === 'Tab') { const nodes = [...dialog.current.querySelectorAll('button,input,select')].filter(node => !node.disabled); const first=nodes[0],last=nodes.at(-1); if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
 }}><h3 id="admin-editor-title">Edit profile & access</h3><fieldset disabled={busy}><label>Name<input name="name" value={form.name} maxLength={120} required onChange={change} /></label><label>Username<input name="username" disabled value={form.username} pattern="[A-Za-z0-9_]{3,40}" minLength={3} maxLength={40} required onChange={change} /></label><label>Role<select name="role" value={form.role} onChange={change}>{['employee','head','admin'].map(value => <option key={value}>{value}</option>)}</select></label><label className="admin-check"><input type="checkbox" name="is_active" checked={form.is_active} onChange={change} /> Account active</label>{accessChanged && <label className="admin-check"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /> Confirm access change for @{form.username}: {form.role}, {form.is_active ? 'active' : 'inactive'}.</label>}</fieldset>{error && <p className="admin-error" role="alert">{error}</p>}<div className="admin-tools"><button type="button" className="secondary-btn" disabled={busy} onClick={onClose}>Cancel</button><button className="primary-btn" disabled={busy || (accessChanged && !confirmed)}>{busy ? 'Saving…' : 'Save'}</button></div></form></div>;
}
