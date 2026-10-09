# Monitoring freshness and remarks trail

1. Supabase > SQL Editor: run supabase/migrations/20261009_project_remarks_trail.sql AFTER the existing project monitoring migration. Run only this new migration for the patch; do not rerun older migrations afterward.
2. Copy workpulse/ patch contents into your project and replace matching files.
3. Run npm run build then npm run dev.

Test: Employee edits a Project row's remarks and saves. Head/Admin/Group POC opens monitoring and refreshes (or waits up to 15 seconds). The card should have a green left border and History should show employee name, timestamp, previous remarks and new remarks. Save the exact same remarks again: no extra entry should appear. Edit only status: no remarks entry should appear. Clear remarks: history should show before and Remarks cleared after. Newly created/imported rows with nonempty remarks also create a recorded entry. Posting a monitoring update also counts as a daily update.

Green means at least one recorded update today, using Asia/Manila timezone; red means no recorded update today. Text saying As of today does not affect this. Existing historical edits cannot be reconstructed: no historical remarks trail is fabricated. Existing recorded monitoring updates remain in History and count normally.

This trigger runs in the existing row save transaction and uses auth.uid() for the author. Existing row permissions remain unchanged. Monitoring history remains restricted to Group POC, Head and Admin. SQL/service-role changes without an authenticated user do not produce a user-attributed entry. Do not allow direct edits to the history table.

Checked locally: ESLint, Philippine midnight freshness test and production build. Database trigger behavior and live permissions still require the Supabase checks above.
