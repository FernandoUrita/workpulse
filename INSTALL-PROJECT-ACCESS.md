# Project membership access

1. Supabase SQL Editor: run supabase/migrations/20261009_project_membership_access.sql AFTER all previous Projects migrations. Do not rerun older migrations afterwards; they restore the old permissions.
2. Copy src/components/layout/Sidebar.jsx and src/features/projects/ProjectsPage.jsx into your existing project. Keep your .env.
3. Run npm run build then npm run dev. Commit/push to deploy on your connected Netlify repository.

Admin/Head sees every Project. Active Group POC or an employee with at least one Assigned To row sees the whole Project and all its rows/history. Created By and text Dev/QA do not grant membership. Existing row edit/approval permissions remain; membership is additionally required for row submit/import, so outsiders cannot gain access by calling those RPCs.

Sidebar hides Projects for employees without an accessible unarchived Project. It checks on focus and every 15 seconds while visible. Direct URL access is protected by RLS and shows an empty state without membership. Previously displayed data clears on the next refresh; database reads and writes follow current permissions immediately.

Verify with separate Head and Employee sessions: employee without membership sees no project; assign one row and employee sees all rows; change Group POC but keep row assignment and employee retains access; remove both POC and all row assignments and access disappears. Confirm a former creator without assignment also has no access. Test edit/review restrictions unchanged.

SQL is supplied for you to apply; it has not been executed against your live Supabase project here.
