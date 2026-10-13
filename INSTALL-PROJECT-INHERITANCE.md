# Project client inheritance and text Dev/QA

1. Copy this patch's src contents into your existing src folder and replace matching files.
2. Supabase SQL Editor: run 20261009_project_inherited_client_text_owners.sql AFTER the original Projects and fixed-columns migrations. Do not rerun the earlier row-writing migrations afterward. Existing UUID Dev/QA assignments become profile display names, with username fallback; existing rows remain.
3. Run npm run build then refresh WorkPulse.

Client name and tier are Project settings. Add/Edit Row hides them; import does not ask for them. Row tables display the Project client name (or Project name when client name is blank) and tier. Editing Project client/name/tier keeps existing rows in sync. Even directly supplied CSV/API client values are overridden by the database.

Assigned Dev and Assigned QA are plain text, max 120 characters. They require no WorkPulse account and confer no editing permission or account notification. Assigned To (POC) remains linked to an active WorkPulse user. Approval notifies the row creator and POC.

Import uses the new 13-column CSV template. All template headers required. Assigned To accepts an active username/UUID or blank; Dev/QA accept any names or blank. Optional client columns from older CSV files are ignored. Maximum 200 rows / 1 MB. Preview and atomic import behavior are retained.

Validation: production build, targeted lint and 21 Node tests. Supabase migration/permission tests and live UI checks must be performed in your environment.
