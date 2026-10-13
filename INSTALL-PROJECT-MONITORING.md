# Project monitoring updates

1. Apply all earlier Projects migrations, including 20261009_project_membership_access.sql, first.
2. Supabase SQL Editor: run supabase/migrations/20261009_project_monitoring.sql.
3. Copy all src files from this patch to matching folders in your existing project. Keep .env and other local files.
4. Run npm run build, then npm run dev. Commit/push to deploy to connected Netlify.

Projects now has a dropdown: Project tables and Project monitoring updates. Monitoring is available to active Admin/Head and the Group POC only; row assignment does not grant access. Each POC sees only their own unarchived groups. Direct URL, snapshot RPC, history reads and posting are restricted in Supabase. Sidebar and monitoring refresh on focus or within 15 seconds while visible.

Overview uses existing rows: totals, status breakdown, pending-party filter, nearest five planned deployments, search and paginated update cards. Deployed/Completed items are excluded from deployment countdowns. Dates use the viewer's local calendar day. Missing dates are shown as not scheduled. Multiple pending parties are matched separately.

Post update saves a concise summary, optional next action and optional follow-up date. Updates are appended; history preserves prior entries and exposes current full Project remarks. This does not modify operational status, approval, assignment or Project remarks. Use Open project table to edit those fields. There are no scheduled reminders or PDF export in this release. PDF example content is not seeded; the app reads your real Project rows.

Manual checks: Head sees all groups; POC sees their group; row-assigned employee cannot access monitoring; removed POC loses access; posting updates retains older history. Optional SQL test scripts/project-monitoring-permissions.test.sql verifies these with rolled-back fixtures (requires Head/Admin and two employees).

Build and targeted lint checked locally. Live Supabase migration and database permission tests must be run in your environment; not executed here.
