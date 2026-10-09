# Grouped sidebar

Copy src/components/layout/Sidebar.jsx and src/styles/layout.css into matching folders of your current WorkPulse project. Keep all other files and .env. Run npm run build then npm run dev. No SQL or new dependency needed.

Dashboard stays at the top. Support contains Tasks, Tickets, Support items. Coordination contains Meetings and MOM Templates. Projects contains Project tables and Project monitoring updates. Management contains Reports and Users (role restricted). Activity and Settings remain direct links.

Groups expand/collapse by clicking the entire heading. Open/closed preference is remembered in this browser. Pending counts remain on child links; collapsed groups show the total. Support defaults open and the current route's group defaults open when no preference is saved. Minimized sidebar retains tooltip labels, toggles and child icons. Mobile uses the same grouping. Project membership and monitoring visibility retain their existing rules.

This patch assumes the latest Project monitoring version is already installed.
