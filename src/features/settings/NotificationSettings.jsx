import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotificationExperience } from '../../context/NotificationExperience.jsx';
import { enablePush, disablePush } from '../../pwa/push.js';
import SendNotificationModal from '../../components/common/SendNotificationModal.jsx';
export default function NotificationSettings(){
 const {currentUser}=useAuth();const {desktopEnabled,soundEnabled,setSound,toggleDesktop,testAlert,testDesktop,preferenceMessage}=useNotificationExperience();
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[compose,setCompose]=useState(false);
 const changePush=async enabled=>{if(busy||!currentUser?.id)return;setBusy(true);setMessage('');try{await(enabled?enablePush(currentUser.id):disablePush(currentUser.id));setMessage(enabled?'Browser push enabled on this device.':'Browser push disabled on this device.');}catch(error){setMessage(error.message);}finally{setBusy(false);}};
 return <div className="settings-group notification-settings"><h4><i className="fas fa-bell" aria-hidden="true"/> Notifications</h4><p className="module-description">Manage alerts on this device. Your bell stays focused on incoming notifications.</p>
 <div className="settings-item"><label>Sound</label><p>Play a chime for incoming alerts while WorkPulse is open.</p><button type="button" className="secondary-btn" aria-pressed={soundEnabled} onClick={()=>setSound(!soundEnabled)}><i className={`fas ${soundEnabled?'fa-volume-up':'fa-volume-mute'}`} aria-hidden="true"/> Sound: {soundEnabled?'On':'Off'}</button></div>
 <div className="settings-item"><label>Desktop alerts</label><p>Show system notifications while WorkPulse is running in another tab. Browser permission is required.</p><button type="button" className="secondary-btn" aria-pressed={desktopEnabled} onClick={toggleDesktop}>Desktop alerts: {desktopEnabled?'On':'Off'}</button>{preferenceMessage&&<p role="status">{preferenceMessage}</p>}</div>
 <div className="settings-item"><label>Browser push</label><p>Receive alerts when the app is closed, once server push setup is configured.</p><div className="settings-actions"><button type="button" className="secondary-btn" disabled={busy} onClick={()=>{void changePush(true);}}>Enable browser push</button><button type="button" className="secondary-btn" disabled={busy} onClick={()=>{void changePush(false);}}>Disable browser push</button></div>{busy&&<p role="status">Updating push preference…</p>}{message&&<p role="status">{message}</p>}</div>
 <details className="notification-settings-tests"><summary>Test alerts</summary><div className="settings-actions"><button type="button" className="secondary-btn" onClick={testAlert}>Test popup & sound</button><button type="button" className="secondary-btn" onClick={testDesktop}>Test desktop (5 seconds)</button></div></details>
 {['head','admin'].includes(currentUser?.role)&&<div className="settings-actions"><button type="button" className="primary-btn" onClick={()=>setCompose(true)}>Send reminder</button></div>}
 {compose&&<SendNotificationModal onClose={()=>setCompose(false)}/>}
 </div>;
}
