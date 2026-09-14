import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAppData } from '../../context/AppDataContext.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';

export default function SettingsPage() {
  const { currentUser, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const { tasks, meetings, items, clearAllData } = useAppData();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleUpdateProfile = () => {
    if (!name.trim()) {
      showToast('warning', 'Missing Name', 'Please enter your name.');
      return;
    }
    updateProfile(name.trim(), email.trim());
    showToast('success', 'Profile Updated', 'Your profile has been saved.');
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    showToast('success', 'Theme Changed', `Switched to ${newTheme} mode.`);
  };

  const handleExport = () => {
    const exportData = {
      user: {
        name: currentUser?.name,
        username: currentUser?.username,
        email: currentUser?.email,
      },
      tasks,
      meetings,
      items,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workpulse_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('success', 'Data Exported', 'Your data has been downloaded.');
  };

  const handleClearConfirm = () => {
    clearAllData();
    setShowClearConfirm(false);
    showToast('success', 'All Data Cleared', 'Everything has been reset to empty.');
  };

  const totalItems = tasks.length + meetings.length + items.length;

  return (
    <section className="module">
      <div className="settings-container">
        {/* ─── PROFILE ─────────────────────────── */}
        <div className="settings-group">
          <h4><i className="fas fa-user"></i> Profile</h4>

          <div className="settings-item">
            <label><i className="fas fa-user-tag"></i> Username</label>
            <input
              type="text"
              value={`@${currentUser?.username || ''}`}
              disabled
            />
          </div>

          <div className="settings-item">
            <label><i className="fas fa-user"></i> Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              maxLength={80}
            />
          </div>

          <div className="settings-item">
            <label><i className="fas fa-envelope"></i> Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              maxLength={120}
            />
          </div>

          <div className="settings-item">
            <div className="settings-actions">
              <button className="primary-btn" onClick={handleUpdateProfile}>
                <i className="fas fa-save"></i> Update Profile
              </button>
            </div>
          </div>
        </div>

        {/* ─── APPEARANCE ──────────────────────── */}
        <div className="settings-group">
          <h4><i className="fas fa-palette"></i> Appearance</h4>

          <div className="settings-info">
            <strong>Current theme:</strong> {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            <br />
            Your preference is saved automatically and will persist across sessions.
          </div>

          <div className="theme-preview">
            <button
              className={`theme-option ${theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              <div className="theme-icon">☀️</div>
              <div className="theme-label">Light Mode</div>
              <div className="theme-desc">Bright and clean</div>
            </button>
            <button
              className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              <div className="theme-icon">🌙</div>
              <div className="theme-label">Dark Mode</div>
              <div className="theme-desc">Easy on the eyes</div>
            </button>
          </div>
        </div>

        {/* ─── DATA MANAGEMENT ─────────────────── */}
        <div className="settings-group">
          <h4><i className="fas fa-database"></i> Data Management</h4>

          <div className="settings-info">
            <strong>Current data:</strong>
            <br />
            📋 {tasks.length} tasks • 📅 {meetings.length} meetings • 📦 {items.length} items
            <br />
            <strong>Total: {totalItems} entries</strong>
          </div>

          <div className="settings-item">
            <label><i className="fas fa-download"></i> Export Data</label>
            <div className="settings-info">
              Download all your data as a JSON file. Perfect for backup or transferring to another device.
            </div>
            <div className="settings-actions">
              <button className="secondary-btn" onClick={handleExport}>
                <i className="fas fa-download"></i> Export All Data
              </button>
            </div>
          </div>
        </div>

        {/* ─── DANGER ZONE ─────────────────────── */}
        <div className="settings-group danger">
          <h4><i className="fas fa-exclamation-triangle"></i> Danger Zone</h4>

          <div className="settings-item">
            <label><i className="fas fa-trash"></i> Clear All Data</label>
            <div className="settings-info" style={{ borderLeftColor: 'var(--danger)' }}>
              <strong>⚠️ Warning:</strong> This will permanently delete <strong>ALL</strong> your tasks, meetings, and items. 
              This action <strong>cannot be undone</strong>. Please export your data first as backup.
            </div>
            <div className="settings-actions">
              <button 
                className="danger-btn" 
                onClick={() => setShowClearConfirm(true)}
                disabled={totalItems === 0}
                style={{ opacity: totalItems === 0 ? 0.5 : 1, cursor: totalItems === 0 ? 'not-allowed' : 'pointer' }}
              >
                <i className="fas fa-trash"></i> Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        show={showClearConfirm}
        title="Clear All Data?"
        message={`This will permanently delete ${totalItems} entries (${tasks.length} tasks, ${meetings.length} meetings, ${items.length} items). This action cannot be undone.`}
        confirmText="Yes, Clear Everything"
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
      />
    </section>
  );
}
