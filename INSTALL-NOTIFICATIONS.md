# WorkPulse – five reminder colors

## Install in this order
1. Back up your project.
2. Open Supabase SQL Editor in your target project. Run the complete contents of supabase/migrations/20261008_reminder_levels.sql. Run this in production too before deploying the frontend. This adds a nullable reminder_level column and preserves existing severity values and RLS policies. Existing head/admin INSERT and recipient SELECT/UPDATE policies must already work.
3. Extract this ZIP. Copy src into your project, replacing matching files and adding the new src/utils/reminderLevels.js. These are COMPLETE files; do not paste diff markers. Keep your current ReportsPage.jsx, AuthContext.jsx and credentials. Copy the SQL migration into your migrations folder for tracking.
4. Run npm run build. Start your app or deploy through your usual Netlify workflow. Accept the PWA update or reload the app after saving work.

## Use and verify
In Reports, use your existing Send reminder button. The same modal also works from the bell. Choose Reminder level / color:
- Red: Urgent
- Orange: Overdue more than a month
- Yellow: Overdue more than a week
- Blue: Daily / gentle reminder
- Green: Normal reminder
A colored preview appears beneath the selector. This is manual selection by the head, not automatic calculation from a task due date. Daily does not schedule recurring sends. Templates choose a starting level; change it as needed.

Use separate head/admin and recipient sessions. Open WorkPulse as the recipient before sending a NEW reminder. Send each level; verify the lower-right popup and bell label/icon match. Sound plays if enabled and browser audio has been unlocked by an interaction. New alerts use Realtime with the existing approximately 8-second fallback. Existing history at initial load stays silent. Clicking the popup marks it read and opens the chosen destination; closing the popup leaves the bell notification unread.

Old notifications without reminder_level fall back to critical=red, warning=yellow, info=blue. Existing automatic alerts retain those fallback colors. The new field maps to the existing severity schema: urgent=critical, month/week=warning, daily/normal=info, keeping current RLS severity checks compatible.

If sending fails with a missing reminder_level column, run the migration on the same Supabase project configured in your frontend. Existing RLS errors require the previously supplied head/admin policies; this color migration does not loosen access rules.

Desktop/OS alerts keep the existing behavior while WorkPulse is open in the background. OS notification colors are controlled by Windows/browser, so these five colors apply to the WorkPulse UI. Closed-tab delivery requires the separate Web Push backend/VAPID/webhook setup.

Validation: production build, lint on changed notification files, and 12 existing notification/PWA tests passed. Live authenticated Supabase delivery and OS sound/display still need your recipient-session test.
