import { PLATFORM_LABELS } from '../../utils/constants.js';
export default function MeetingCard({meeting,onViewMom,onPrint,onEdit,onDelete}) {
 const date=meeting.date?new Date(`${meeting.date}T${meeting.time||'00:00'}`):null;
 const valid=date&&!Number.isNaN(date.getTime());
 const status=meeting.completed?'Completed':valid&&date<new Date()?'Past':'Upcoming';
 const safeLink=/^https?:\/\//i.test(meeting.link||'')?meeting.link:null;
 return <article className="meeting-card wp-meeting">
 <div className="wp-date-tile"><small>{valid?date.toLocaleDateString('en-US',{weekday:'short'}):'Date'}</small><strong>{valid?date.toLocaleDateString('en-US',{month:'short',day:'numeric'}):'Not set'}</strong><small>{valid?date.getFullYear():''}</small><span><i className="far fa-clock" aria-hidden="true"/> {valid?date.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'No time'}</span></div>
 <div className="wp-meeting-body"><header><h4>{meeting.title}</h4><span className="project-chip chip-blue">{meeting.type==='remote'?'Remote':'Physical'}</span><span className={`project-chip chip-${meeting.completed?'green':'gray'}`}>{status}</span></header>
 <div className="wp-meeting-meta"><span><i className="fas fa-video" aria-hidden="true"/> {PLATFORM_LABELS[meeting.platform]||meeting.platform||'No platform'}</span>{meeting.location&&<span><i className="fas fa-map-marker-alt" aria-hidden="true"/> {meeting.location}</span>}</div>
 {!!meeting.attendees?.length&&<div className="meeting-attendees">{meeting.attendees.map((a,i)=><span className="attendee-pill" key={i}>{a}</span>)}</div>}
 {!!meeting.agenda?.length&&<div className="wp-meeting-agenda"><small>Agenda</small><ul>{meeting.agenda.map((a,i)=><li key={i}>{a}</li>)}</ul></div>}
 <div className="wp-meeting-link"><small>Meeting link</small>{safeLink?<a href={safeLink} target="_blank" rel="noopener noreferrer">Open meeting link <i className="fas fa-external-link-alt" aria-hidden="true"/></a>:<span>{meeting.link||'To be confirmed'}</span>}</div>
 {(meeting.anydeskId||meeting.teamviewerId)&&<details className="wp-connection"><summary>Connection details</summary><p>{meeting.anydeskId?`AnyDesk: ${meeting.anydeskId}`:`TeamViewer: ${meeting.teamviewerId}`}</p>{(meeting.anydeskPassword||meeting.teamviewerPassword)&&<p>Password: {meeting.anydeskPassword||meeting.teamviewerPassword}</p>}</details>}
 {meeting.mom&&<p className="wp-mom-excerpt">{meeting.mom.slice(0,180)}{meeting.mom.length>180?'…':''}</p>}
 <footer className="wp-card-actions"><button className="primary-btn" onClick={()=>onViewMom(meeting)}><i className={`fas ${meeting.completed?'fa-file-alt':'fa-check-circle'}`} aria-hidden="true"/>{meeting.completed?'View MOM':'End meeting & MOM'}</button><button className="secondary-btn" onClick={()=>onPrint(meeting)}><i className="fas fa-print" aria-hidden="true"/> Print</button><button className="secondary-btn" onClick={()=>onEdit(meeting)}><i className="fas fa-pen" aria-hidden="true"/> Edit</button><details className="wp-more"><summary aria-label={`More actions for ${meeting.title}`}>⋮</summary><button type="button" className="danger-btn" onClick={()=>onDelete(meeting)}>Delete meeting</button></details></footer>
 </div></article>;
}
