# Notification sync update

Changed: src/context/NotificationContext.jsx and src/components/common/NotificationBell.jsx.

Copy these two files into your existing project (keep your existing .env.local and .git). Run npm run dev.

1. Log in and insert your test notification. Open the bell: title, message, unread dot, badge and icon should appear.
2. Open a second tab with the same user. Insert another notification: it should appear in both tabs with no duplicates.
3. Click a notification: read=true should save before navigation. The other tab should reflect the read state.
4. Dismiss a notification: dismissed=true should save and it should disappear in both tabs.
5. Mark all read / Clear all: verify the currently listed database rows were updated.
6. Disconnect the network and try a read/dismiss action: an error should appear and the UI should not claim success. Reconnect and Retry.
7. Log out, then log in with another user: previous account notifications should not remain.
8. Reconnect or refocus the tab: notifications should refresh.

Auto-generated reminders remain in-memory; their read/dismiss state resets on reload. The bell loads the most recent 50 database notifications. Realtime publication and RLS must already be configured in Supabase. No SQL or live database changes were made.

Validation: production build and ESLint on the two changed files. Live authenticated two-tab testing remains to be performed in your local app.
