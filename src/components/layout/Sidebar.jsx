import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';

const NAV_GROUPS = [
  {id:'support',label:'Support',icon:'fa-headset',items:[
    {path:'/tasks',label:'Tasks',icon:'fa-tasks',badgeKey:'tasks'},
    {path:'/tickets',label:'Tickets',icon:'fa-ticket-alt',badgeKey:'tickets'},
    {path:'/items',label:'Support items',icon:'fa-box',badgeKey:'items'},
  ]},
  {id:'coordination',label:'Coordination',icon:'fa-calendar-alt',items:[
    {path:'/meetings',label:'Meetings',icon:'fa-calendar-alt',badgeKey:'meetings'},
    {path:'/mom',label:'MOM Templates',icon:'fa-file-alt'},
  ]},
  {id:'projects',label:'Projects',icon:'fa-project-diagram',items:[
    {path:'/projects',label:'Project tables',icon:'fa-table'},
    {path:'/projects/monitoring',label:'Project monitoring updates',icon:'fa-chart-line',monitor:true},
  ]},
  {id:'management',label:'Management',icon:'fa-users-cog',items:[
    {path:'/reports',label:'Reports',icon:'fa-chart-line',roles:['head','admin']},
    {path:'/users',label:'Users',icon:'fa-users-cog',roles:['admin']},
  ]},
];

export default function Sidebar({ isOpen, onToggle, minimized, onMinimize }) {
  const location=useLocation();
  const [expanded,setExpanded]=useState(()=>{
    try { return JSON.parse(localStorage.getItem('workpulse:nav-groups')||'{}')||{}; } catch { return {}; }
  });
  const toggleGroup=(id,isExpanded)=>setExpanded(previous=>{
    const next={...previous,[id]:!isExpanded};
    try { localStorage.setItem('workpulse:nav-groups',JSON.stringify(next)); } catch { /* Keep session preference. */ }
    return next;
  });
  const { currentUser, logout } = useAuth();
  const { tasks, meetings, items, tickets } = useAppData();

  const [projectAccess, setProjectAccess] = useState(null);
  useEffect(() => {
    let alive=true, request=0;
    const check=async()=>{
      const version=++request;
      const result=await supabase.from('projects').select('id,poc_id').eq('archived',false);
      if(alive&&version===request)setProjectAccess({userId:currentUser?.id,allowed:!result.error&&result.data?.length>0,monitor:!result.error&&result.data?.some(g=>g.poc_id===currentUser?.id)});
    };
    const start=setTimeout(()=>{void check();},0);
    const timer=setInterval(()=>{if(document.visibilityState==='visible')void check();},15000);
    const focus=()=>{void check();};
    window.addEventListener('focus',focus);
    return()=>{alive=false;clearTimeout(start);clearInterval(timer);window.removeEventListener('focus',focus);};
  },[currentUser?.id,currentUser?.role]);
  const showProjects=['head','admin'].includes(currentUser?.role)||(projectAccess?.userId===currentUser?.id&&projectAccess.allowed);

  const showMonitoring=['head','admin'].includes(currentUser?.role)||(projectAccess?.userId===currentUser?.id&&projectAccess.monitor);

  // Badge: bilangin lang yung PENDING (hindi completed) tasks
  const badges = {
    tasks: tasks.filter(t => !t.done).length,
    meetings: meetings.filter(m => !m.completed).length,
    items: items.filter(i => i.status !== 'completed' && i.status !== 'cancelled').length,
    tickets: (tickets || []).filter(t => t.status !== 'Closed' && t.status !== 'On Hold').length,
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <i className="fas fa-heartbeat"></i>
          <h2>Work<span>Pulse</span></h2>
        </div>
        <button type="button" className="sidebar-minimize" onClick={onMinimize} aria-label={minimized ? 'Expand sidebar' : 'Minimize sidebar'} title={minimized ? 'Expand sidebar' : 'Minimize sidebar'} aria-expanded={!minimized}><i className={`fas ${minimized ? 'fa-angle-double-right' : 'fa-angle-double-left'}`} aria-hidden="true" /></button>
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Close navigation">
          <i className="fas fa-bars"></i>
        </button>
      </div>

      <div className="user-profile">
        <div className="user-avatar">
          <i className="fas fa-user-circle"></i>
        </div>
        <div className="user-info">
          <h4>{currentUser?.name || 'User'}</h4>
          <span>@{currentUser?.username || 'username'}</span>
        </div>
        <button className="logout-btn" onClick={logout} title="Logout">
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        <ul>
          <li className="nav-item"><NavLink to="/dashboard" title="Dashboard" aria-label="Dashboard" onClick={onToggle}><i className="fas fa-th-large" aria-hidden="true"/><span>Dashboard</span></NavLink></li>
          {NAV_GROUPS.filter(group=>group.id!=='projects'||showProjects).map(group=>{
            const children=group.items.filter(item=>(!item.roles||item.roles.includes(currentUser?.role))&&(!item.monitor||showMonitoring));
            if(!children.length)return null;
            const active=children.some(item=>location.pathname===item.path);
            const open=expanded[group.id]??(active||group.id==='support');
            const count=children.reduce((total,item)=>total+(badges[item.badgeKey]||0),0);
            return <li className="nav-item sidebar-nav-group" key={group.id}>
              <button type="button" className={`sidebar-group-toggle ${active?'group-active':''}`} title={group.label} aria-label={`${open?'Collapse':'Expand'} ${group.label}${count?`, ${count} pending`:''}`} aria-expanded={open} aria-controls={`nav-group-${group.id}`} onClick={()=>toggleGroup(group.id,open)}>
                <i className={`fas ${group.icon}`} aria-hidden="true"/><span className="sidebar-group-label">{group.label}</span>{!open&&count>0&&<span className="badge">{count}</span>}<i className={`fas fa-chevron-${open?'up':'down'} sidebar-group-arrow`} aria-hidden="true"/>
              </button>
              {open&&<ul id={`nav-group-${group.id}`} className="sidebar-group-children">{children.map(item=><li key={item.path}><NavLink to={item.path} end title={item.label} aria-label={item.label} onClick={onToggle}><i className={`fas ${item.icon}`} aria-hidden="true"/><span>{item.label}</span>{item.badgeKey&&badges[item.badgeKey]>0&&<span className="badge">{badges[item.badgeKey]}</span>}</NavLink></li>)}</ul>}
            </li>;
          })}
          <li className="nav-item"><NavLink to="/activity" title="Activity" aria-label="Activity" onClick={onToggle}><i className="fas fa-stream" aria-hidden="true"/><span>Activity</span></NavLink></li>
          <li className="nav-item"><NavLink to="/settings" title="Settings" aria-label="Settings" onClick={onToggle}><i className="fas fa-cog" aria-hidden="true"/><span>Settings</span></NavLink></li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="version">
          v2.0.0
          {currentUser?.role && (
            <span className={`role-badge role-${currentUser.role}`}>
              {currentUser.role}
            </span>
          )}
        </div>

      </div>
    </aside>
  );
}
