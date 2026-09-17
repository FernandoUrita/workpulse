import { useSyncExternalStore } from 'react';
import { subscribePwa, getPwaSnapshot, installApp, applyUpdate, retryOfflineSetup } from '../../pwa/client.js';

export default function PwaControls() {
  const state = useSyncExternalStore(subscribePwa, getPwaSnapshot, getPwaSnapshot);
  return (
    <div className="pwa-controls">
      <div className="pwa-toolbar">
        <span className={`pwa-status ${state.online ? '' : 'is-offline'}`} role="status">
          {!state.online ? 'Offline · changes stay on this device' : state.ready ? 'Ready for offline use' : 'Online'}
        </span>
        {!state.installed && (state.canInstall ? (
          <button className="secondary-btn" type="button" onClick={installApp}>Install WorkPulse</button>
        ) : (
          <details className="pwa-install-help">
            <summary>Install on your device</summary>
            <p>Open your browser menu and look for <strong>Install app</strong> or <strong>Add to Home Screen</strong>. On iPhone or iPad, use Safari’s Share menu, then Add to Home Screen. Availability depends on your browser.</p>
          </details>
        ))}
      </div>
      {state.updateAvailable && (
        <div className="pwa-notice" role="status">
          <p><strong>A new version is ready.</strong> Save any open forms before updating.</p>
          <button className="primary-btn" type="button" onClick={applyUpdate}>Update and reload</button>
        </div>
      )}
      {state.error && (
        <div className="pwa-notice" role="status">
          <p>{state.error}</p>
          {!state.updateAvailable && <button className="secondary-btn" type="button" onClick={retryOfflineSetup}>Retry offline setup</button>}
        </div>
      )}
    </div>
  );
}
