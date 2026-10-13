# Reference dashboard patch

Copy the contents of workpulse/ into your project and replace matching files. Sidebar and global topbar files are not changed. No SQL or credentials changes.

Run npm run build then npm run dev. Check dashboard cards, attention rows, meeting timeline, Add Meeting modal, activity details and expandable chart section.

The reference appearance uses a blue background, large icon cards, colored attention rows and a compact audit activity feed. Current user, dates and counts use actual available data. High-priority tickets replace the reference SLA row because no SLA deadline field exists. Support follow-ups replace the reference hypercare-ending row because ticket hypercare end dates are not stored. Active Hypercare counts tickets with status Hypercare. Recent Activity uses available audit logs, with recently created records as fallback.

Verified: scoped ESLint and production build. Browser visual comparison and production data checks remain.
