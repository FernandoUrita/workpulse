# Projects — fixed schema, CSV import and approval

This corrects the initial simplified Projects release. All 15 agreed fields are now present: ticket_no, custom_name, client_name, client_tier, applied_to, system, priority, assigned_to, assigned_dev, assigned_qa, status, is_signed, deployment_date, pending_to, remarks.

## Apply

1. Back up source and database. Copy this ZIP's src contents into your existing src folder; replace matching files. Keep your .env and package-lock.json.
2. Supabase → SQL Editor: if the original Projects schema is not installed, run 20261008_projects.sql first. Then run 20261009_project_fixed_columns.sql. The upgrade preserves existing groups and rows. Do not rerun the old migration afterward because it restores the old row-writing API.
3. Existing rows retain names, remarks, client/tier, assignments and dates. Old Pending work statuses become Ongoing. Existing rows enter pending review. Their Ticket no. is blank until you edit it and supply the real number.
4. Run npm run build, then npm run dev. Open Projects.

## Workflow

Head/admin creates a Project table. Employees add rows with the 15 fixed fields; they may propose POC/Dev/QA assignments. Saving submits the row for head/admin review. Head approves → approval_status becomes approved, work status becomes Active, creator and assigned users receive notifications. Head may reject with a reason; employee edits/resubmits. Employee or POC edits to approved rows require review again. Head edits to already approved rows retain approval.

Approval state is separate from work status. Work statuses: Ongoing, Active, In Progress, For QA, Completed, On Hold. Only head/admin approves or rejects. Approved-row assignment changes require head/admin or the current group/row POC. All active users can view Project tables; creators, assigned users and POCs can edit their rows. Groups expand/collapse and show a horizontally scrollable table, search, review filters and pagination.

## CSV import

Click Import CSV under a Project → Download CSV template. Fill all 15 columns. Export Excel as CSV UTF-8. Use active usernames (not display names) or UUIDs for Assigned To/Dev/QA; blank is allowed. Client tier: Standard, VIP, VVIP, VVVIP. System: JPS, ESS, BUNDY, WEBHR, PPH, INSIGHT. Priority: Critical, High, Medium, Low. Is Signed?: Yes/No. Deployment date: YYYY-MM-DD or blank.

Choose file → inspect validated preview → Import & submit. Maximum 200 rows, 1 MB. Imports add new rows; they do not update existing rows. Ticket no. must be unique within a Project (case-insensitive). Invalid records or duplicate tickets abort the entire batch. Multiline quoted remarks are supported. Imported rows always require review; CSV cannot approve rows.

## Verify

Test two accounts: employee submits, head approves/rejects, assigned Dev/QA receives a notification. Optional scripts/projects-permissions.test.sql verifies database permissions, atomic imports and stale edits using three existing active accounts, then rolls back fixtures. The older permission script has been updated for the new API.

Local validation: targeted lint, production build, CSV tests plus existing Node tests. SQL/live browser delivery must be verified in your Supabase environment. No new credentials or packages needed. Apply SQL before deploying the UI to Netlify.
