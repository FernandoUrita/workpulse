# Daily dashboard update

Copy the patch files into the WorkPulse root and replace matching files. No SQL or environment changes are required.

Run `npm run build`, then `npm run dev`. Open Dashboard. Check that each summary, attention row, meeting, recent record and chart opens a searchable details modal. The modal Open button navigates to the existing module. Charts are under Workload insights.

Counts use records available to the signed-in user through the existing data context. Hypercare counts tickets whose status is Hypercare. Awaiting client response uses open tickets with Pending To = Client. Recently added uses creation timestamps; the full Activity page contains audit events. No SLA or hypercare end date is inferred. Dates follow the browser local timezone.

Test the dashboard with employee, head and admin accounts before deploying. No live Supabase or browser visual verification was performed for this patch.
