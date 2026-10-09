import ProjectPicker from '../../components/common/ProjectPicker.jsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useModalDialog } from '../../hooks/useModalDialog.js';
import '../../styles/projects.css';

import { PROJECT_COLUMNS, PROJECT_ROW_FIELDS, PROJECT_SYSTEMS, PROJECT_TIERS, PROJECT_PRIORITIES, PROJECT_STATUSES, emptyProjectRow, parseProjectCSV } from '../../utils/projectColumns.js';
import { stringifyCSV, downloadCSV } from '../../utils/csvHelpers.js';

export default function ProjectsPage() {
 const { currentUser } = useAuth();
 const [params,setParams] = useSearchParams();
 const [data,setData] = useState({projects:[],rows:[],profiles:[],audit:[]});
 const [loading,setLoading] = useState(true);
 const [error,setError] = useState('');
 const [dialog,setDialog] = useState(null);
 const [showArchived,setShowArchived] = useState(false);
 const generation=useRef({request:0});
 const head=['head','admin'].includes(currentUser?.role);
 const refresh=useCallback(async()=>{
  const request=++generation.current.request;
  const results=await Promise.all([supabase.from('projects').select('*').order('created_at',{ascending:false}),supabase.from('project_rows').select('*').order('created_at',{ascending:false}),supabase.from('profiles').select('id,name,username,is_active').order('name'),supabase.from('project_audit').select('*').order('created_at',{ascending:false}).limit(200)]);
  if(request!==generation.current.request)return;
  const failure=results.find(result=>result.error)?.error;setError(failure?.message||'');
  if(!failure)setData({projects:results[0].data,rows:results[1].data,profiles:results[2].data,audit:results[3].data});setLoading(false);
 },[]);
 useEffect(()=>{const requests=generation.current;const initial=setTimeout(()=>{void refresh();},0);const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},15000);const focus=()=>{void refresh();};window.addEventListener('focus',focus);return()=>{requests.request++;clearTimeout(initial);clearInterval(timer);window.removeEventListener('focus',focus);};},[refresh]);
 const userName=id=>data.profiles.find(p=>p.id===id)?.name||data.profiles.find(p=>p.id===id)?.username||'—';
 const groups=data.projects.filter(project=>showArchived||!project.archived);
 const selected=groups.find(project=>project.id===params.get('project'))||groups[0];
 return <section className="module projects-module"><div className="module-header"><div className="module-heading"><h3><i className="fas fa-project-diagram" aria-hidden="true" /> Project tables</h3><p className="module-description">Client work tables with assignments and head approval.</p></div><div className="module-actions"><button className="secondary-btn" onClick={()=>{void refresh();}}>Refresh</button>{head&&<button className="primary-btn" onClick={()=>setDialog({kind:'project'})}>+ New Project</button>}</div></div>
 {error&&<p className="projects-error" role="alert">{error}</p>}
 {loading?<p role="status">Loading projects…</p>:<>
 <div className="project-workspace-bar"><ProjectPicker projects={groups} selected={selected} onChange={id=>setParams(previous=>{const next=new URLSearchParams(previous);next.set('project',id);return next;})}/><label className="projects-checkbox"><input type="checkbox" checked={showArchived} onChange={event=>setShowArchived(event.target.checked)}/> Include archived</label>{selected&&<div className="project-workspace-client"><strong>{selected.client_name||selected.name}</strong><span className={`project-tier tier-${(selected.tier||'Standard').toLowerCase()}`}>{selected.tier}</span></div>}</div>
 {selected?<ProjectTable key={selected.id} project={selected} rows={data.rows.filter(row=>row.project_id===selected.id)} audit={data.audit.filter(entry=>entry.project_id===selected.id)} currentUser={currentUser} head={head} userName={userName} onEdit={value=>setDialog({...value,project:selected,existingRows:data.rows.filter(row=>row.project_id===selected.id)})}/>:<div className="empty-state-enhanced"><h3>No accessible Projects</h3><p>{head?'Create your first Project table.':'Your head must assign you as Group POC or Assigned To on a row.'}</p></div>}
 </>}
 {dialog?.kind==='remarks' ? <RemarksDialog row={dialog.value} onClose={()=>setDialog(null)} onEdit={dialog.canEdit?()=>setDialog(previous=>({...previous,kind:'row'})):null}/> : dialog&&<ProjectEditor key={`${dialog.kind}-${dialog.value?.id||dialog.project?.id||'new'}`} dialog={dialog} profiles={data.profiles} currentUser={currentUser} head={head} onClose={()=>setDialog(null)} onSaved={async()=>{setDialog(null);await refresh();}}/>}
 </section>;
}

const TABLE_COLUMNS=PROJECT_COLUMNS.filter(([key])=>!['client_name','client_tier','priority'].includes(key));
const BADGE_COLORS={
 status:{ongoing:'yellow',deployed:'green','for review':'orange','on hold':'gray',active:'green','in progress':'yellow','for qa':'purple',completed:'green'},
 pending_to:{'js-qa':'purple','js-dev':'teal','js-support':'blue',asurion:'yellow'},
 system:{jps:'blue',ess:'purple',bundy:'teal',webhr:'green',pph:'orange',insight:'pink'}
};
function ValueBadges({value,kind}) {
 const values=String(value||'').split(',').map(item=>item.trim()).filter(Boolean);
 return values.length?<span className="project-badge-list">{values.map((label,index)=><span key={`${label}-${index}`} className={`project-chip chip-${BADGE_COLORS[kind]?.[label.toLowerCase()]||'gray'}`}>{label}</span>)}</span>:'—';
}

function ProjectTable({project,rows,audit,currentUser,head,userName,onEdit}) {
 const [query,setQuery]=useState('');const [filter,setFilter]=useState('all');const [page,setPage]=useState(1);const [history,setHistory]=useState(false);const [fit,setFit]=useState(true);
 const filtered=rows.filter(row=>(filter==='all'||row.approval_status===filter)&&PROJECT_COLUMNS.some(([key])=>String(row[key]||'').toLowerCase().includes(query.toLowerCase())));
 const pages=Math.max(1,Math.ceil(filtered.length/10));const currentPage=Math.min(page,pages);
 const editable=row=>head||[project.poc_id,row.created_by,row.assigned_to].includes(currentUser.id);
 const value=(row,key)=>{
  if(key==='remarks')return row.remarks?.trim()?<div className="project-remarks-cell"><p className="project-remarks-preview">{row.remarks.replace(/\s+/g,' ').trim()}</p><button type="button" className="project-remarks-link" aria-label={`View remarks for ${row.ticket_no||row.custom_name}`} onClick={()=>onEdit({kind:'remarks',value:row,canEdit:editable(row)&&!project.archived})}>View remarks <i className="fas fa-external-link-alt" aria-hidden="true"/></button></div>:'—';
  if(key==='assigned_to')return row[key]?<ValueBadges value={userName(row[key])} kind="person"/>:'—';
  if(['status','pending_to','system','assigned_dev','assigned_qa'].includes(key))return <ValueBadges value={row[key]} kind={key}/>;
  if(key==='is_signed')return <span className={`project-chip chip-${row[key]?'green':'yellow'}`}>{row[key]?'Yes':'No'}</span>;
  return row[key]||'—';
 };
 return <section className="project-group project-workspace-table" aria-label={`${project.name} rows`}><div className="project-group-body"><div className="project-workspace-summary"><strong>{rows.length} items</strong><span>{rows.filter(row=>row.approval_status==='pending').length} pending review{project.archived?' · Archived':''}</span></div>
 <div className="project-overview-actions"><button type="button" className="secondary-btn" aria-pressed={fit} onClick={()=>setFit(!fit)}>{fit?'Detailed width':'Fit table'}</button>{head&&<button className="secondary-btn" onClick={()=>onEdit({kind:'project',value:project})}>Edit Project</button>}<button className="secondary-btn" aria-pressed={history} onClick={()=>setHistory(!history)}>History</button>{!project.archived&&<><button className="secondary-btn" onClick={()=>onEdit({kind:'import'})}>Import CSV</button><button className="primary-btn" onClick={()=>onEdit({kind:'row'})}>+ Add Row</button></>}</div>
 <div className="projects-toolbar"><label>Search<input value={query} placeholder="Ticket, client or remarks…" onChange={event=>{setQuery(event.target.value);setPage(1);}}/></label><label>Review state<select value={filter} onChange={event=>{setFilter(event.target.value);setPage(1);}}><option value="all">All rows</option><option value="pending">Pending review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label></div>
 <div className={`projects-table ${fit ? 'projects-table-fit' : ''}`}><table><colgroup>{[6,11,7,7,7,7,7,7,5,8,8,12,4,4].map((width,index)=><col key={index} style={fit?{width:`${width}%`}:undefined}/>)}</colgroup><thead><tr>{TABLE_COLUMNS.map(([key,label])=><th key={key}>{label}</th>)}<th>Review</th><th aria-label="Actions"><i className="fas fa-ellipsis-h" aria-hidden="true"/></th></tr></thead><tbody>{filtered.slice((currentPage-1)*10,currentPage*10).map(row=><tr key={row.id}>{TABLE_COLUMNS.map(([key])=><td key={key} className={key==='remarks'?'project-remarks-column':undefined}>{value(row,key)}</td>)}<td><span className={`project-review review-${row.approval_status}`}>{row.approval_status||'pending'}</span>{row.rejection_reason&&<small>{row.rejection_reason}</small>}</td><td><div className="project-row-actions">{!project.archived&&editable(row)&&<button type="button" className="secondary-btn project-icon-action" title="Edit row and priority" aria-label={`Edit ${row.ticket_no||row.custom_name}`} onClick={()=>onEdit({kind:'row',value:row})}><i className="fas fa-pen" aria-hidden="true"/></button>}{!project.archived&&head&&row.approval_status==='pending'&&<button type="button" className="primary-btn project-icon-action" title="Review row" aria-label={`Review ${row.ticket_no||row.custom_name}`} onClick={()=>onEdit({kind:'review',value:row})}><i className="fas fa-check" aria-hidden="true"/></button>}</div></td></tr>)}{!filtered.length&&<tr><td colSpan={TABLE_COLUMNS.length+2}>No matching rows.</td></tr>}</tbody></table></div>
 <div className="projects-pagination"><span>{filtered.length} rows · Page {currentPage} of {pages}</span><button className="secondary-btn" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}>Previous</button><button className="secondary-btn" disabled={currentPage===pages} onClick={()=>setPage(currentPage+1)}>Next</button></div>
 {history&&<div className="project-history"><h4>Recent history</h4><p>From the latest 200 events across projects.</p>{audit.map(entry=><p key={entry.id}>{entry.action} · {userName(entry.actor_id)} · {new Date(entry.created_at).toLocaleString()}</p>)}</div>}
 <small className="project-table-note">{fit?'Fit mode wraps text to show all columns when enough space is available. Minimize the sidebar for more room.':'Detailed width uses horizontal scrolling for larger cells.'}</small>
 </div></section>;
}

function ProjectEditor({dialog,profiles,currentUser,head,onClose,onSaved}) {
 const kind=dialog.kind;const group=kind==='project';const review=kind==='review';const importing=kind==='import';
 const [form,setForm]=useState(()=>dialog.value||(group?{name:'',client_name:'',tier:'Standard',poc_id:'',archived:false}:{...emptyProjectRow(),client_name:dialog.project?.client_name||'',client_tier:dialog.project?.tier||'Standard',assigned_to:dialog.project?.poc_id||''}));
 const [reason,setReason]=useState('');const [decision,setDecision]=useState('approve');const [parsed,setParsed]=useState([]);const [fileName,setFileName]=useState('');
 const [saving,setSaving]=useState(false);const [error,setError]=useState('');const busy=useRef(false);
 const modal=useModalDialog(true,()=>{if(!busy.current)onClose();});
 const manager=head||[dialog.project?.poc_id,dialog.value?.assigned_to].includes(currentUser.id);
 const assignmentDisabled=dialog.value?.approval_status==='approved'&&!manager;
 const change=(key,value)=>setForm(previous=>({...previous,[key]:value}));
 const pickUser=(key,label,disabled=false)=><label className="form-group">{label}<select value={form[key]||''} disabled={disabled} onChange={event=>change(key,event.target.value)}><option value="">Unassigned</option>{profiles.filter(profile=>profile.is_active||profile.id===form[key]).map(profile=><option key={profile.id} value={profile.id} disabled={!profile.is_active}>{profile.name||profile.username} (@{profile.username}){!profile.is_active?' — Inactive':''}</option>)}</select></label>;
 const select=(key,label,options)=><label className="form-group">{label}<select value={form[key]} onChange={event=>change(key,event.target.value)}>{options.map(option=><option key={option}>{option}</option>)}</select></label>;
 const previewCSV=async event=>{
  const file=event.target.files?.[0];setParsed([]);setFileName('');setError('');if(!file)return;
  if(file.size>1024*1024){setError('CSV must be 1 MB or smaller.');return;}
  try{const rows=parseProjectCSV(await file.text(),profiles,dialog.project,{allowUnresolved:true});const existing=new Set(dialog.existingRows.map(row=>row.ticket_no?.trim().toLowerCase()).filter(Boolean));const duplicate=rows.find(row=>existing.has(row.ticket_no.toLowerCase()));if(duplicate)throw new Error(`Ticket ${duplicate.ticket_no} already exists in this Project.`);setParsed(rows);setFileName(file.name);}catch(failure){setError(failure.message);}
 };
 const template=()=>downloadCSV('project-import-template.csv',stringifyCSV(PROJECT_ROW_FIELDS.map(([key])=>key),[{...emptyProjectRow(),ticket_no:'CST-001',custom_name:'Wilcon JPS Migration',client_name:'Wilcon',client_tier:'VVIP',applied_to:'Wilcon',priority:'High',is_signed:'No',deployment_date:'2026-10-15',pending_to:'Client',remarks:'Waiting for sign-off'}]));
 const submit=async event=>{
  event.preventDefault();if(busy.current)return;busy.current=true;setSaving(true);setError('');
  try{
   let result;
   if(group)result=await supabase.rpc('project_save',{p_id:dialog.value?.id||null,p_name:form.name,p_client:form.client_name,p_tier:form.tier,p_poc:form.poc_id||null,p_archived:form.archived});
   else if(review)result=await supabase.rpc('project_row_review',{p_id:dialog.value.id,p_approve:decision==='approve',p_reason:reason,p_expected:dialog.value.updated_at});
   else if(importing){if(!parsed.length)throw new Error('Select and validate a CSV first.');if(parsed.some(row=>row._assigned_to_label&&!row.assigned_to))throw new Error('Map all Assigned To names to active accounts first.');result=await supabase.rpc('project_rows_import',{p_project:dialog.project.id,p_rows:parsed});}
   else result=await supabase.rpc('project_row_submit',{p_project:dialog.project.id,p_id:dialog.value?.id||null,p_data:Object.fromEntries(PROJECT_ROW_FIELDS.map(([key])=>[key,form[key]??''])),p_expected:dialog.value?.updated_at||null});
   if(result.error)throw result.error;await onSaved();
  }catch(failure){setError(failure.code==='23505'?'Duplicate Ticket no. in this Project. No rows were imported.':failure.message||'Could not save.');}finally{busy.current=false;setSaving(false);}
 };
 return <div className="projects-backdrop" onClick={event=>{if(event.target===event.currentTarget&&!busy.current)onClose();}}><div className="projects-dialog" {...modal}><div className="modal-header"><h3>{group?(dialog.value?'Edit Project':'New Project'):review?'Review project row':importing?'Import project rows':dialog.value?'Edit project row':'New project row'}</h3><button className="close-modal" disabled={saving} type="button" aria-label="Close editor" onClick={onClose}>×</button></div><form onSubmit={submit}><fieldset className="projects-form" disabled={saving}>
 {group?<><label className="form-group">Project name<input required maxLength={120} value={form.name} onChange={event=>change('name',event.target.value)}/></label><label className="form-group">Client name<input maxLength={120} value={form.client_name} onChange={event=>change('client_name',event.target.value)}/></label>{select('tier','Client tier',PROJECT_TIERS)}{pickUser('poc_id','Group POC')}<label className="projects-checkbox"><input type="checkbox" checked={form.archived} onChange={event=>change('archived',event.target.checked)}/> Archive Project</label><p>All rows inherit this Project’s client name and tier. Dev and QA are plain text names.</p></>:review?<><strong>{form.ticket_no} · {form.custom_name}</strong><p>Approving makes the row Active and notifies the employee and assigned POC.</p><label className="form-group">Decision<select value={decision} onChange={event=>setDecision(event.target.value)}><option value="approve">Approve</option><option value="reject">Reject</option></select></label><label className="form-group">{decision==='reject'?'Rejection reason (required)':'Review note (optional)'}<textarea required={decision==='reject'} maxLength={1000} rows={3} value={reason} onChange={event=>setReason(event.target.value)}/></label></>:importing?<><button className="secondary-btn" type="button" onClick={template}>Download CSV template</button><label className="form-group">CSV file<input type="file" accept=".csv,text/csv" onChange={previewCSV}/></label><p>Priority is optional and defaults to Medium; set it later in Edit Row. The other 12 headers are required. Client name and tier come from this Project. Assigned To uses an active username or UUID; Assigned Dev and QA are plain text. Systems can be comma-separated (JPS, ESS). Dates: YYYY-MM-DD or M/D/YYYY; - means no date. Maximum 200 rows / 1 MB. Import adds new pending-review rows.</p>{parsed.length>0&&<><strong>{fileName}: {parsed.length} rows parsed</strong>{[...new Set(parsed.map(row=>row._assigned_to_label).filter(Boolean))].map(label=><label className="form-group" key={label}>Map Assigned To: {label}<select value={parsed.find(row=>row._assigned_to_label===label)?.assigned_to||''} onChange={event=>setParsed(previous=>previous.map(row=>row._assigned_to_label===label?{...row,assigned_to:event.target.value||null}:row))}><option value="">Select active WorkPulse account</option>{profiles.filter(profile=>profile.is_active).map(profile=><option key={profile.id} value={profile.id}>{profile.name} (@{profile.username})</option>)}</select></label>)}<div className="project-import-preview">{parsed.slice(0,10).map(row=><p key={row.ticket_no}>{row.ticket_no} · {row.custom_name} · {row.client_name} · {row.system}</p>)}</div><p>Preview shows the first 10 rows. All rows will be submitted together.</p></>}</>:<><p>Client: {dialog.project.client_name||dialog.project.name} · Tier: {dialog.project.tier} (inherited from Project)</p>{PROJECT_ROW_FIELDS.map(([key,label])=>{
  if(key==='assigned_to')return <div key={key}>{pickUser(key,label,assignmentDisabled)}</div>;
  if(key==='system')return <div className="form-group" key={key}><span>System (select one or more)</span>{PROJECT_SYSTEMS.map(system=><label className="projects-checkbox" key={system}><input type="checkbox" checked={(form.system||'').split(',').map(value=>value.trim()).includes(system)} onChange={event=>{const selected=(form.system||'').split(',').map(value=>value.trim()).filter(Boolean);change('system',event.target.checked?[...new Set([...selected,system])].join(', '):selected.filter(value=>value!==system).join(', '));}}/>{system}</label>)}</div>;
  const options={client_tier:PROJECT_TIERS,system:PROJECT_SYSTEMS,priority:PROJECT_PRIORITIES,status:PROJECT_STATUSES}[key];if(options)return <div key={key}>{select(key,label,options)}</div>;
  if(key==='is_signed')return <label key={key} className="projects-checkbox"><input type="checkbox" checked={form[key]} onChange={event=>change(key,event.target.checked)}/>{label}</label>;
  return <label key={key} className="form-group">{label}{key==='remarks'?<textarea maxLength={2000} rows={4} value={form[key]||''} onChange={event=>change(key,event.target.value)}/>:<input type={key==='deployment_date'?'date':'text'} required={['ticket_no','custom_name'].includes(key)} disabled={['assigned_dev','assigned_qa'].includes(key)&&assignmentDisabled} maxLength={120} value={form[key]||''} onChange={event=>change(key,event.target.value)}/>}</label>;
 })}<p>{head&&dialog.value?.approval_status==='approved'?'Saving keeps this row approved.':'Saving submits this row for head approval. Employee/POC edits require a new review.'}</p></>}
 {error&&<p className="projects-error" role="alert">{error}</p>}</fieldset><div className="modal-footer"><button className="secondary-btn" disabled={saving} type="button" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={saving||(importing&&(!parsed.length||parsed.some(row=>row._assigned_to_label&&!row.assigned_to)))} type="submit">{saving?'Saving…':importing?'Import & submit':review?'Confirm review':group?'Save Project':head&&dialog.value?.approval_status==='approved'?'Save changes':'Submit for review'}</button></div></form></div></div>;
}

function RemarksDialog({row,onClose,onEdit}) {
 const modal=useModalDialog(true,onClose);
 return <div className="projects-backdrop" onClick={event=>{if(event.target===event.currentTarget)onClose();}}><div className="projects-dialog project-remarks-dialog" {...modal}>
  <div className="modal-header"><div><h3>Remarks</h3><p className="project-remarks-subtitle">{row.ticket_no} · {row.custom_name}</p></div><button type="button" className="close-modal" aria-label="Close remarks" onClick={onClose}>×</button></div>
  <div className="project-remarks-body">{row.remarks||'No remarks yet.'}</div>
  <div className="modal-footer"><button type="button" className="secondary-btn" onClick={onClose}>Close</button>{onEdit&&<button type="button" className="primary-btn" onClick={onEdit}>Edit remarks</button>}</div>
 </div></div>;
}
