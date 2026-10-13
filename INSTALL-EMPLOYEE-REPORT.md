# Employee Report Modal

1. Back up your project.
2. Copy the four included src files to the matching paths in your project. ReportsPage.jsx is based on your latest uploaded file. No AppDataContext replacement or SQL migration is needed.
3. Run npm run build, then start the app or deploy. Accept the PWA update after saving work.
4. Open Reports as head/admin. Click an employee row or use Tab to reach the employee name button and press Enter.
5. Verify four category tabs, summary counts, search, filters and 10-record pagination. Try an employee with no records. Escape, backdrop click and Close should dismiss the modal.
6. Click Send reminder. The detail modal closes and your existing reminder modal opens with this employee selected. Your installed five-color notification package supplies the color picker.

Records follow the existing Reports ownership basis (user_id), not shared assignees. Date filters apply to record creation timestamps. Labels now accurately describe the existing rolling periods: last 24 hours, 7 days and 30 days. Selecting a range refreshes the report time reference. The report uses the existing useAllData fetch and does not add Realtime refresh.

Pending includes incomplete tasks/meetings, non-closed tickets and items that are neither completed nor cancelled. Overdue uses task due_date, ticket timeline when it contains a parseable date, and item next_check. Date-only deadlines become overdue after the local due day ends. Meetings do not contribute overdue/stale flags. Stale means no recorded update for 5+ days, based on the most recent available updated_at, created_at, ticket date_last_update or item last_check. Invalid/missing dates are displayed as unknown and do not generate flags. Counts overlap: an active record can be both overdue and stale. Completed/closed/cancelled records do not generate attention flags.

Includes responsive and dark-theme styles, focus trapping/return, scroll locking and keyboard-accessible employee buttons. No individual-record navigation is added because the existing module pages do not expose a verified record-detail route.

Validation: production build and lint passed; four report calculation tests and 12 existing notification/PWA tests passed. Live head/admin Reports and authenticated reminder delivery require your app-session test.

Milestone: Employee Report Modal implemented; live acceptance testing pending. Closed-tab Web Push, production verification, Admin Panel review and Projects remain pending.
