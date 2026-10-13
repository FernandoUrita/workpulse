# Spreadsheet CSV compatibility

Copy this patch's src contents into existing src and replace matching files. Supabase SQL Editor: run 20261009_project_csv_compatibility.sql AFTER the inherited-client/text-owner migration. Then npm run build and refresh.

Your original 12-column Asurion CSV is supported without editing its headers. Priority remains optional (Medium default). Systems accept comma-separated supported values, such as JPS, ESS. Edit Row uses system checkboxes. Deployed and For Review work statuses are supported and preserved on import. Deployment dates accept M/D/YYYY or YYYY-MM-DD; a dash means no date. Multiline remarks and quoted commas are retained.

Assigned To remains account-linked. Exact username, UUID or unique full display-name matches resolve automatically. Unmatched or ambiguous display names appear in mapping dropdowns. Select an active WorkPulse account for each name before Import & submit becomes available. Dev and QA remain plain text. Imported rows still need head approval; approval sets Active according to the existing workflow.

The supplied Asurion CSV parsed all 12 rows locally. Build, targeted lint and 24 Node tests passed. Live SQL migration and account delivery still require verification in your environment. No new packages or credentials.
