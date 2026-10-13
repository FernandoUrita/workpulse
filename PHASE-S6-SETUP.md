# WorkPulse Phase S6

Implemented: role-gated Send reminder modal in the bell panel, database-backed read/dismiss, manual reminders, Web Push subscription controls, push service-worker display/click handlers, webhook Edge Function, and subscription RLS migration.

Status: local build passes; notification-file lint passes; eight service-worker tests pass. SQL and Edge Function have not been executed against your Supabase project. Live two-tab and browser push delivery need your authenticated environment.

## Install the source changes

Keep your existing .git and .env.local. Copy src/components/common/NotificationBell.jsx, src/components/common/SendNotificationModal.jsx, src/context/NotificationContext.jsx, src/context/AuthContext.jsx, src/pwa/push.js, scripts/sw-template.js, scripts/pwa.test.mjs and the supabase folder into your project.

## Send reminder UI

1. Run supabase/migrations/20261005_notifications_push.sql in your project's SQL editor after your existing notifications schema.
2. Confirm existing notifications SELECT/UPDATE RLS only allows the recipient to access/update their rows. Confirm profiles roles cannot be changed by ordinary employees. This migration adds a restrictive manual-send guard and subscription owner policies; it does not replace your existing schema.
3. Run npm run dev. Log in as head/admin, open the bell and click Send reminder.
4. Select a recipient, title, message, priority and destination. Success appears only after the database insert returns. Employees cannot see the composer; the database guard also rejects their direct inserts.
5. Open the recipient session in another browser/profile and verify the reminder, read/dismiss and unread count. Normal employees must receive notifications but not send them.

## Activate browser push

1. Generate a VAPID key pair locally: npx web-push generate-vapid-keys
2. Add the PUBLIC key to your existing frontend .env.local: VITE_VAPID_PUBLIC_KEY=<public key>. Do not put the private key or service-role key in Vite environment variables.
3. Set these Supabase Edge Function secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:your-real-email), PUSH_WEBHOOK_SECRET (a newly generated long random secret). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are supplied by hosted Supabase functions.
4. Link the Supabase CLI to your project, then deploy: supabase functions deploy notification-push --no-verify-jwt
5. Create a Supabase Database Webhook for public.notifications INSERT events. Target https://<project-ref>.supabase.co/functions/v1/notification-push, HTTP POST, content-type application/json, x-webhook-secret set to your PUSH_WEBHOOK_SECRET. The function verifies the webhook secret before reading the canonical notification row. Never publish that secret in frontend code.
6. Run npm run build and npm run preview, or deploy the production build on HTTPS. Open the app, accept its PWA update if prompted, and click Enable browser push from the bell. Push setup requires the production service worker; npm run dev alone does not register it.
7. Send a fresh reminder from a separate head/admin session. Verify desktop delivery with the recipient tab open and then closed. Clicking the notification should open its chosen app page. A recipient who has not enabled push still receives the in-app reminder.
8. Click Disable push to stop this device's subscription. Explicit logout also unsubscribes this device before signing out.

## Verification and limits

Run npm run build, npm run test:pwa and ESLint on the changed notification files. The worker tests cover payload display, malformed payloads, navigation, closed-window opening and external-link rejection, in addition to existing offline/update tests.

The backend supports common Chrome/Edge, Firefox and Apple push endpoint domains. Delivery errors leave the notification in the bell; expired endpoints are removed. Webhook retry configuration is external; duplicate delivery uses a stable notification tag. This code does not guarantee delivery when the OS/browser disables background notifications.

Existing auto alerts (overdue/stale/upcoming/check-in) are computed in the running app and are not scheduled server-side push jobs. Their read/dismiss state remains in-memory. Only inserted database notifications trigger this webhook. A scheduled auto-alert generator is separate follow-up work.

No Git commit, push, Supabase migration, function deployment, or production change was performed from this workspace.
