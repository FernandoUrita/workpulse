# Compact Settings workspace

Replace src/features/settings/SettingsPage.jsx and add src/styles/settings-workspace.css in your current project. Run npm run build then npm run dev. No SQL/dependency required.

Settings now has Profile, Appearance, Notifications, Data & backup, and Danger zone tabs. Only the selected section is visible. Desktop uses a compact local navigation rail; mobile wraps section buttons. Arrow keys, Home/End and accessible tab/panel labels supported. Profile edits and notification controls retain state while switching tabs. Danger action still uses the existing confirmation dialog. Notification controls no longer span the whole screen.

This is a layout patch: existing handlers/permissions are unchanged. JSON export wording now names only the actual exported modules. Build and changed-file lint verified; browser visual check still needed on your setup.
