# Client confirmation approval patch

1. Copy the included src files to your existing WorkPulse project.
2. Apply 20261009_project_client_confirmation_approval.sql LAST, after previous Projects migrations (including remarks trail). Works whether or not the no-approval migration was applied. Do not run the no-approval migration afterward.
3. npm run build; npm run dev.

Flow: Ongoing -> Completed (internally complete) -> Deployed -> record Client Confirmed with evidence -> For approval -> Head/Admin approves -> Active.
CSV imports do not infer client confirmation. Active cannot be newly assigned through normal editing or imports. Legacy Active rows are retained; no past client confirmation is fabricated.
Rejected items stay Deployed. Update confirmation evidence to resubmit; saving unchanged evidence retains rejection. Moving back to another work stage clears current confirmation and approval. History retains the audit event.
Remarks changes do not activate items or reset a pending confirmation. Daily freshness still uses recorded remarks/monitoring posts.

Verification on your Supabase:
- Add/import Ongoing: no review action. Completed: no review action.
- Deployed without confirmation: no review action; direct review RPC must fail.
- Check Client Confirmed and enter response evidence: shows For approval, not Active; audit includes author and timestamp; Head/Admin notified.
- Ordinary employee calling review RPC must fail. Head approves -> Active.
- Reject with reason -> remains Deployed; unchanged save remains rejected; new evidence -> pending.
- Attempt to manually assign/import new Active -> error; atomic import must roll back.
- Stale review/save -> refresh error. Archived project -> error.
- Remarks-only edit preserves work status and confirmation; remarks trail remains available.

Local build, scoped lint and CSV/freshness regression checks performed. Live SQL execution and browser verification are not performed in this environment.
