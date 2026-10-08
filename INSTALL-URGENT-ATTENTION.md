# Urgent Attention — install

1. Back up your project. Copy the src folder from this patch into your existing workpulse folder and replace matching files. This patch does not change package.json, package-lock.json or your .env.
2. Run npm run build. Run npm run dev to test locally.
3. Sign in as head/admin. Reports now has an Urgent Attention button beside the custom reminder button. It is also in the employee report modal.
4. On the employee account, enable Sound and interact with WorkPulse after each reload. Enable desktop notifications separately for background OS alerts.
5. Click Urgent Attention twice, waiting for each send to finish. Expect two database notifications, two red popups and a double chime per delivery in the focused recipient tab. Popups stay until opened or closed. Closing a popup does not dismiss its bell entry.
6. Push these source changes to your Git repository to trigger your configured Netlify deployment.

Prerequisite: the existing notifications RLS and reminder_level migration must already be applied. No additional SQL or credentials are needed for this patch. An inactive employee cannot receive this quick reminder. Each completed click sends a new notification; the button only disables during the current request.

The louder chime applies inside the focused WorkPulse tab. Background desktop sounds and volume depend on browser/OS settings. Closed-app push still requires the separate Web Push backend setup. Actual recipient delivery needs testing in your Supabase environment.
