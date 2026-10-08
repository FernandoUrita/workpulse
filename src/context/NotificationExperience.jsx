import { REMINDER_LEVELS, reminderLevel } from '../utils/reminderLevels.js';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { useNotifications } from './NotificationContext.jsx';
import { safeNotificationPath, unseenLiveAlerts } from '../utils/notificationDelivery.js';

const ExperienceContext = createContext(null);
function readPreference(userId, name) {
  try { return Boolean(userId) && localStorage.getItem(`workpulse:${userId}:${name}`) === 'true'; }
  catch { return false; }
}
function savePreference(userId, name, value) {
  try { if (userId) localStorage.setItem(`workpulse:${userId}:${name}`, String(value)); }
  catch { /* Preferences still work for this session if browser storage is blocked. */ }
}

export function NotificationExperience({ children }) {
  const { currentUser } = useAuth();
  return <SessionExperience key={currentUser?.id || 'signed-out'} userId={currentUser?.id}>{children}</SessionExperience>;
}

function SessionExperience({ userId, children }) {
  const { liveAlerts, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [popups, setPopups] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(() => readPreference(userId, 'alert-sound'));
  const [desktopEnabled, setDesktopEnabled] = useState(() => readPreference(userId, 'desktop-alerts'));
  const [preferenceMessage, setPreferenceMessage] = useState('');
  const seen = useRef(new Set());
  const audio = useRef(null);
  const desktopNotices = useRef(new Set());
  const testTimers = useRef(new Set());
  const mounted = useRef(false);

  const unlockAudio = useCallback(async () => {
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioClass) return false;
    try {
      if (!audio.current || audio.current.state === 'closed') audio.current = new AudioClass();
      if (audio.current.state === 'suspended') await audio.current.resume();
      return audio.current.state === 'running';
    } catch { return false; }
  }, []);
  const playChime = useCallback(() => {
    const context = audio.current;
    if (!context || context.state !== 'running') return;
    const now = context.currentTime;
    [660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.13;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(start); oscillator.stop(start + 0.24);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }, []);

  useEffect(() => {
    const notices = desktopNotices.current;
    const timers = testTimers.current;
    mounted.current = true;
    return () => {
      mounted.current = false;
      for (const notice of notices) notice.close();
      notices.clear();
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      audio.current?.close().catch(() => {});
      audio.current = null;
    };
  }, []);
  useEffect(() => {
    if (!soundEnabled) return;
    const unlock = () => { void unlockAudio(); };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, [soundEnabled, unlockAudio]);

  const closePopup = useCallback(id => setPopups(prev => prev.filter(n => n.id !== id)), []);
  const openAlert = useCallback(async row => {
    if (!mounted.current) return;
    if (!row.preview && !await markAsRead(row.id)) return;
    if (!mounted.current) return;
    closePopup(row.id);
    window.focus();
    navigate(safeNotificationPath(row.link, window.location.origin));
  }, [markAsRead, closePopup, navigate]);

  const present = useCallback(row => {
    // Only the focused WorkPulse tab should chime; hidden tabs use OS alerts.
    const foreground = document.visibilityState === 'visible' && document.hasFocus();
    if ((row.desktopTest || (!row.preview && !foreground)) && desktopEnabled && window.isSecureContext && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notice = new Notification(row.title || 'WorkPulse', {
          body: row.message || '', tag: `workpulse-${row.id}`, silent: !soundEnabled,
        });
        desktopNotices.current.add(notice);
        notice.onclick = () => { notice.close(); void openAlert(row); };
        notice.onclose = () => desktopNotices.current.delete(notice);
      } catch (err) {
        setPreferenceMessage(`Desktop notification could not display: ${err.message}. Check browser and Windows notification settings.`);
      }
    }
    setPopups(prev => [...prev.filter(n => n.id !== row.id), row].slice(-3));
    if (foreground && soundEnabled) playChime();
  }, [desktopEnabled, soundEnabled, openAlert, playChime]);

  useEffect(() => {
    const fresh = unseenLiveAlerts(liveAlerts || [], userId, seen.current);
    // Consume only fresh events emitted by Realtime or the fallback snapshot tracker.
    fresh.forEach(present);
  }, [liveAlerts, userId, present]);

  const setSound = async enabled => {
    if (enabled && !await unlockAudio()) {
      setPreferenceMessage('Audio is blocked or unsupported. Click Sound On again after interacting with the page.');
      return;
    }
    if (!mounted.current) return;
    setSoundEnabled(enabled); savePreference(userId, 'alert-sound', enabled);
    setPreferenceMessage(enabled ? 'Sound enabled. After a reload, interact with the app once to unlock audio.' : 'Sound muted.');
    if (enabled) playChime();
  };
  const toggleDesktop = async () => {
    if (desktopEnabled) {
      setDesktopEnabled(false); savePreference(userId, 'desktop-alerts', false);
      setPreferenceMessage('Background desktop alerts disabled. Browser push is managed separately.');
      return;
    }
    if (!window.isSecureContext || !('Notification' in window)) {
      setPreferenceMessage('Desktop alerts require a supported browser on HTTPS or localhost.'); return;
    }
    const permission = await Notification.requestPermission();
    if (!mounted.current) return;
    const granted = permission === 'granted';
    setDesktopEnabled(granted); savePreference(userId, 'desktop-alerts', granted);
    setPreferenceMessage(granted ? 'Desktop alerts enabled while WorkPulse is open in the background.' : 'Notifications are blocked or permission was not granted. Check browser site settings.');
  };
  const testAlert = async () => {
    if (soundEnabled) await unlockAudio();
    if (!mounted.current) return;
    present({ id: `preview-${Date.now()}`, title: 'WorkPulse notification test', message: 'Your popup is ready. Sound plays when enabled.', link: '/dashboard', severity: 'info', preview: true });
  };

  const testDesktop = async () => {
    if (!window.isSecureContext || !('Notification' in window)) {
      setPreferenceMessage('Desktop notifications require HTTPS or localhost and a supported browser.'); return;
    }
    const permission = await Notification.requestPermission();
    if (!mounted.current) return;
    if (permission !== 'granted') { setPreferenceMessage('Notification permission is not granted. Allow notifications in browser site settings.'); return; }
    setDesktopEnabled(true); savePreference(userId, 'desktop-alerts', true);
    setPreferenceMessage('Desktop test scheduled in 5 seconds. Switch to another browser/app now.');
    const timer = setTimeout(() => {
      testTimers.current.delete(timer);
      if (!mounted.current) return;
      try {
        const notice = new Notification('WorkPulse desktop test', { body: 'Your browser can request a Windows notification.', tag: 'workpulse-desktop-test', silent: !soundEnabled });
        desktopNotices.current.add(notice);
        notice.onclose = () => desktopNotices.current.delete(notice);
        notice.onclick = () => { notice.close(); window.focus(); };
        setPreferenceMessage('Desktop notification requested. If nothing appeared, check Windows Do Not Disturb and browser notification settings.');
      } catch (err) { setPreferenceMessage(`Desktop test failed: ${err.message}`); }
    }, 5000);
    testTimers.current.add(timer);
  };

  return <ExperienceContext.Provider value={{ desktopEnabled, soundEnabled, setSound, toggleDesktop, testAlert, testDesktop, preferenceMessage }}>
    {children}
    <div className="wp-alert-stack" aria-live="polite" aria-relevant="additions">
      {popups.map(row => <AlertCard key={row.id} row={row} onClose={closePopup} onOpen={openAlert} />)}
    </div>
  </ExperienceContext.Provider>;
}

function AlertCard({ row, onClose, onOpen }) {
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(() => document.visibilityState === 'hidden');
  useEffect(() => {
    const changed = () => setHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  }, []);
  useEffect(() => {
    if (paused || hidden) return;
    const timer = setTimeout(() => onClose(row.id), 6000);
    return () => clearTimeout(timer);
  }, [row.id, onClose, paused, hidden]);
  return <article className={`wp-alert-card wp-alert-level-${reminderLevel(row)}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false); }}>
    <span className="wp-alert-icon" aria-hidden="true"><i className="fas fa-bell"></i></span>
    <button className="wp-alert-open" type="button" onClick={() => onOpen(row)}><span className="wp-alert-label">WORKPULSE · {REMINDER_LEVELS[reminderLevel(row)].label}</span><strong>{row.title}</strong><span>{row.message}</span><small>{row.preview ? 'Test notification' : 'Click to open'}</small></button>
    <button className="wp-alert-close" type="button" onClick={() => onClose(row.id)} aria-label="Close popup">×</button>
  </article>;
}

// Hook intentionally exported beside the provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useNotificationExperience() {
  const context = useContext(ExperienceContext);
  if (!context) throw new Error('useNotificationExperience requires NotificationExperience');
  return context;
}
