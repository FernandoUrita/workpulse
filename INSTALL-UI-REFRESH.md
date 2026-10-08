# WorkPulse – module UI refresh

Full source project based on the latest S7 package. Includes removal of admin account creation, silent unchanged-profile checks, and the existing email-style username SQL fix. Copy your existing .env.local into the extracted workpulse folder; run npm ci, npm run build and npm run dev. Preserve your existing database. There is no new SQL migration for the UI refresh. Only run the previously supplied admin username fix if your database still rejects email-style usernames.

## Improvements
Shared spacing, surface borders, rounded controls, consistent button sizing, clearer headings/descriptions, filter/search controls, stat cards, tables, empty states, compact navigation and responsive layouts. Topbar now correctly names Tickets, Reports, Users and Activity instead of falling back to Dashboard. Existing theme variables and five reminder colors are retained.

Task, ticket, meeting, item, check-in, import, MOM and confirmation dialogs gain accessible dialog roles, title association, keyboard focus management, Escape dismissal, focus return and background scroll locking. Existing form labels are linked to single controls where possible. Sticky modal headers/footers, scrollable long content and single-column mobile forms improve usability. Task/ticket history filtering no longer calls a hook after an early return. Existing admin and employee-report dialogs keep their own focus management and benefit from shared visual styles.

## Targeted merge
Copy src/styles/ui-refresh.css, src/hooks/useModalDialog.js and update src/main.jsx (new CSS import). Also replace these complete files from the ZIP:
- src/components/layout/Topbar.jsx
- src/components/common/ConfirmModal.jsx
- Module pages: dashboard/DashboardPage, tasks/TasksPage, tickets/TicketsPage, meetings/MeetingsPage, items/ItemsPage, reports/ReportsPage, activity/ActivityPage, mom/MomTemplatesPage, settings/SettingsPage, admin/UsersPage (all under src/features, .jsx)
- Dialogs: tasks/TaskModal, tasks/TaskDetailModal, tickets/TicketModal, tickets/TicketDetailModal, tickets/ImportModal, items/ItemModal, items/ItemDetailModal, items/CheckinModal, meetings/MeetingModal, meetings/MomModal, meetings/ViewMomModal, mom/EditMomTemplateModal (all under src/features, .jsx)
Use the full project to avoid missing the shared hook. This is a UI enhancement, not a replacement of the modules' data models or workflows.

## Check in your browser
1. Open each module in light/dark themes. Verify headings, primary actions and search/filter controls.
2. Open new/edit/detail dialogs across Tasks, Tickets, Meetings and Items. Confirm values load and Save/Cancel still work.
3. Press Tab/Shift+Tab inside a dialog: focus should stay inside. Escape closes the topmost dialog; when a select has focus, finish its native interaction first. Closing restores focus. Long forms should scroll with their title/actions visible.
4. Test confirmation dialogs opened over detail dialogs. Background scrolling should remain locked until the final dialog closes.
5. Test at 390px mobile width: filters wrap, forms stack, tables scroll within their containers and buttons remain usable.
6. Test CSV import preview and cancel/reopen, MOM edit/view, Reports employee modal, Send Reminder and Users access editor.
7. Accept PWA updates after saving work, or restart your dev server if styles are stale.

## Validation and limits
Production build passed. New shared modal hook, Topbar, ConfirmModal, ImportModal and task/ticket detail dialogs passed targeted lint. All 16 existing report/notification/PWA tests passed; these do not cover visual styling. The repository still has pre-existing lint findings in legacy form-initialization/data-sync effects and other modules. Browser screenshot/interactive QA could not run because browser installation failed in this environment; verify the steps above in your actual signed-in app before deployment. No live Supabase operations were performed.
