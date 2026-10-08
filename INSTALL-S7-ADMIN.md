# WorkPulse S7 – existing-account administration

Account creation is handled by the existing login/register page. Admin Panel only manages existing profiles: display name, employee/head/admin role, deactivate/reactivate and audit log. The Create Employee button and admin-users Edge Function dependency have been removed.

## Already installed S7?
Replace ONLY src/features/admin/UsersPage.jsx with the complete file from this ZIP. Restart npm run dev or rebuild/redeploy. No new SQL or Edge Function deployment is required. Keep the previously applied S7 migration: it supplies role editing, deactivation and audit logging. The former admin-users function is no longer called.

## Fresh S7 installation
1. Back up source/database and preserve your .env.local.
2. Run supabase/migrations/20261008_admin_panel.sql in the correct Supabase project. Existing profiles/work tables and at least one admin must already exist. The case-insensitive username index requires no duplicate usernames. Existing profiles must have id,name,username,email,role,avatar_url,updated_at.
3. Restore .env.local, run npm ci, npm run build, then npm run dev. No Edge Function is required for the admin panel.
4. Register a test employee from the login/register page. Complete email confirmation if required by your existing Supabase Auth settings. In a separate admin session open Users and click Refresh; edit the new employee to assign head/admin access.

## Verification
Users is admin-only. Test role changes, inactive sign-out, reactivation and audit entries using a test employee. Direct employee writes to profiles.role/is_active and admin_audit_log should fail. Self-access edits are blocked; usernames remain fixed to preserve task assignments. Deactivation preserves records and removes push subscriptions. Access changes affect subsequent work-data requests immediately, with UI refresh on focus or within 30 seconds. Existing downloaded content cannot be erased from an open tab. Audit displays 200 latest events. Registration creation events are not newly added to the admin audit log; access/profile changes are logged. There is no permanent deletion, password reset or email editing in this milestone.

Production build and changed-file lint passed. Prior report/notification/PWA tests passed during initial S7 work; they do not verify new SQL/RLS. Live Supabase setup and permission testing are still required.

## Silent profile refresh fix
The 30-second/focus access check now preserves currentUser object identity when all displayed profile fields are unchanged. This prevents dependent data hooks from refetching and showing loading screens on every check. Actual role/profile changes still update state; inactive accounts still sign out. For existing installs, replace src/context/AuthContext.jsx along with src/features/admin/UsersPage.jsx (the latter removes Create Employee). No SQL changes are needed for this fix.

## Existing email-style username fix
If saving a role fails with a username-format validation message, run supabase/migrations/20261008_admin_existing_username_fix.sql in SQL Editor. It replaces only admin_save_user, accepts the unchanged existing username and retains name validation and access protections. No frontend change is needed.
