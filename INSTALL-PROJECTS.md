# Projects bonus — install and test

1. Back up your source. Copy this patch's src contents into your existing src folder; replace matching files. Preserve your .env and package-lock.json.
2. Supabase → SQL Editor: run supabase/migrations/20261008_projects.sql. Prerequisites: S7 Admin schema (profiles.is_active and workpulse_is_active function), S6 notifications schema and reminder_level migration. The script runs transactionally and can be rerun.
3. Run npm run build, then npm run dev. Open Projects in the sidebar.
4. Head/admin: create a group, choose Standard/VIP/VVIP/VVVIP, select an active POC. POC should receive a bell notification linking to the group.
5. Employee: add a row. POC/head/admin: edit it and assign Dev/QA. New assignees receive notifications. A person assigned both roles gets one notification per save.
6. Owner, Dev or QA can update their row; other employees can view it. Only POC/head/admin can change assignments. Head/admin manages group details and archiving. POC is a project assignment, not a new account role.
7. Test notification delivery using different signed-in accounts. Recipient popup/sound uses their existing notification preferences. Projects refresh in the background every 15 seconds and on window focus; manual Refresh is available.
8. Optional database verification: run scripts/projects-permissions.test.sql in SQL Editor. It needs three active existing profiles: one head/admin, one employee, and one other user. All fixture writes are rolled back.
9. Commit the source files and push to trigger your configured Netlify deployment. Apply SQL before publishing the new UI.

All active WorkPulse accounts can view all project groups, rows and recent history. Groups are archived, not deleted. Rows have Pending, In Progress, For QA, Completed and On Hold statuses; these are manually selected. Client tiers are labels and do not automatically change reminder urgency. Existing Tasks/Tickets/Reports remain separate; project rows are not included in Reports counts yet.

This release includes automatic assignment notifications, not scheduled overdue/stale server alerts. Closed-app push requires your existing push backend configuration.

Validation here: production build, targeted Projects lint, existing Node tests. SQL permission tests are supplied for your environment; no live Supabase migration or browser delivery test was run here.
