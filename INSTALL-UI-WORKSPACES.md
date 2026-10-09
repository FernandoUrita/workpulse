# WorkPulse UI cleanup + searchable Project workspaces

Copy all src files in the patch into matching folders of your current WorkPulse project. Keep .env and other local files. Run npm run build then npm run dev. No SQL or dependency install required; existing Project membership/monitoring migrations must already be applied.

Projects now displays one selected Project at a time instead of a growing accordion. Switch Project opens a searchable picker with client/tier, accessible Projects only, ten results per page and keyboard-accessible buttons. Project query URLs still select the correct group. Monitoring uses the same picker. Switching groups resets row search/pagination/editor state; import, approvals, history and remarks remain available. Include archived toggles available table groups.

Cleanup: topbar shows workspace category instead of duplicating page title. Online/install toolbar no longer appears on every page; install remains available on Settings, offline/update/error notices remain global. Theme toggle remains in the topbar. Task progress no longer repeats completed/pending/overdue totals; task empty state has one create action. Monitoring Support items show next-check information once. MOM explanation is collapsible. Dashboard totals use a balanced 4-column layout. Sidebar hover highlights only the hovered link, and active highlights follow the exact route.

Verification: production build and 24 existing tests pass. Changed components pass lint except TasksPage's two pre-existing setState-in-effect errors at its deep-link/detail synchronization effects; these were not introduced or modified in this UI patch. Browser visual verification is still needed on your setup, especially mobile/dark theme.
