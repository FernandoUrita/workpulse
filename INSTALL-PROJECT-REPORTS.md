# Project Reports

Copy workpulse/ contents into your project and replace matching files. No new SQL or credentials required. Existing Projects schema and membership RLS migrations must already be applied.

Run npm run build then npm run dev. Sign in as Head/Admin and open Reports > Project reports. Test summary drilldowns, search/filter, pagination, Group POC workload, project links and CSV export. Employee report behavior remains available in its own tab.

Definitions: active projects exclude archived groups. Completed rows have operational status Deployed or Completed; approval is separate. Overdue means deployment date before the browser local day and status neither Deployed nor Completed. Pending approvals means approval_status=pending. Group POC workload counts open rows under their groups, rather than individual row assignment. Dev and QA are text fields. Projects use a current snapshot independently of the employee creation-date filter. CSV exports the currently filtered project summary, across all pages.

Queries use the authenticated Supabase client and existing RLS. Head/Admin role check restricts this report UI; database policies remain authoritative. Errors clear the report rather than showing stale counts. Refresh runs every 15 seconds while visible and on window focus.

Verification: scoped lint, production build, existing regression tests. Live Supabase role tests and browser interaction checks were not performed.
