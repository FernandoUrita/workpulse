let snapshot = {
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  ready: false,
  canInstall: false,
  installed: false,
  updateAvailable: false,
  error: '',
};
const listeners = new Set();
let installPrompt;
let waitingWorker;
let registration;
let reloadRequested = false;
let started = false;
let lastUpdateCheck = 0;

function publish(changes) {
  snapshot = { ...snapshot, ...changes };
  listeners.forEach(listener => listener());
}
export const getPwaSnapshot = () => snapshot;
export function subscribePwa(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function trackRegistration(value) {
  registration = value;
  if (value.active) publish({ ready: true });
  if (value.waiting) {
    waitingWorker = value.waiting;
    publish({ updateAvailable: true });
  }
  const trackWorker = () => {
    const worker = value.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        waitingWorker = value.waiting || worker;
        publish({ updateAvailable: true, error: '' });
      } else if (worker.state === 'activated') {
        publish({ ready: true, error: '' });
      } else if (worker.state === 'redundant') {
        publish({ error: 'Offline setup could not finish. Stay online and retry.' });
      }
    });
  };
  value.addEventListener('updatefound', trackWorker);
  trackWorker();
}

export async function retryOfflineSetup() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  publish({ error: '' });
  try {
    if (registration) await registration.update();
    else trackRegistration(await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }));
  } catch {
    publish({ error: 'Offline setup could not finish. Stay online and retry.' });
  }
}

export function startPwa() {
  if (started) return;
  started = true;
  const standalone = window.matchMedia('(display-mode: standalone)');
  const syncInstalled = () => publish({ installed: standalone.matches || navigator.standalone === true });
  syncInstalled();
  standalone.addEventListener('change', syncInstalled);
  window.addEventListener('online', () => { publish({ online: true }); checkForUpdate(); });
  window.addEventListener('offline', () => publish({ online: false }));
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    publish({ canInstall: true });
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = undefined;
    publish({ canInstall: false, installed: true });
  });
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    publish({ ready: true });
    if (reloadRequested) window.location.reload();
  });
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'UPDATE_BLOCKED') {
      reloadRequested = false;
      publish({ error: 'Save your work and close other WorkPulse tabs or windows, then try the update again.' });
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
  if (document.readyState === 'complete') retryOfflineSetup();
  else window.addEventListener('load', retryOfflineSetup, { once: true });
}

async function checkForUpdate() {
  if (!registration || !navigator.onLine || Date.now() - lastUpdateCheck < 60000) return;
  lastUpdateCheck = Date.now();
  try { await registration.update(); } catch { /* Keep the working offline version. */ }
}

export async function installApp() {
  if (!installPrompt) return;
  const prompt = installPrompt;
  installPrompt = undefined;
  publish({ canInstall: false, error: '' });
  try {
    await prompt.prompt();
    await prompt.userChoice;
  } catch {
    publish({ error: 'Installation was not available. Try the install option in your browser menu.' });
  }
}

export function applyUpdate() {
  if (!waitingWorker) return;
  // A click is explicit permission to reload this tab; other tabs are protected.
  reloadRequested = true;
  publish({ error: '' });
  waitingWorker.postMessage({ type: 'ACTIVATE_UPDATE' });
}
