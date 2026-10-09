# Compact Project table + color badges

1. Stop the dev server. Extract this ZIP and copy the two src files into the matching folders of your existing workpulse project.
2. Run `npm run build`, then `npm run dev` to preview. For Netlify, commit and push these files to your connected repository.

No SQL migration or dependency install is needed for this UI patch. Keep your existing .env and other files.

Client name and tier are now in the Project header. Priority remains editable in Edit Row. The table shows the 12 import fields plus approval and compact actions. Status and Pending To colors follow your screenshots. Comma-separated systems and pending parties display as separate chips; imported data is unchanged. Unknown badge values use gray. Edit and Review icons have accessible labels and tooltips. Remarks keep the three-line preview and full reader. Narrow screens may still need horizontal scrolling.
