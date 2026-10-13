# WorkPulse unified layouts — v2

The actual components now follow the supplied visual references using one shared shell and UI stylesheet.

- Projects: compact Customization + ticket cell, Team column for Support/Dev/QA, five-row pagination, full original fields in Detailed columns, remarks reader and existing approval actions. Signed/unsigned remains visible in compact view.
- Meetings: date tiles, participant chips, agenda, short meeting links, MOM/print/edit controls, delete under More actions. Past meetings retain their original completion state.
- MOM Templates: formatted preview of the actual saved template, raw view and a reference panel for the existing supported placeholders.
- Tasks: selectable table, completion controls, details/edit/delete, existing bulk controls and board view.
- Tickets and items: consistent readable cards and labeled actions; delete remains in the original confirmation workflow.
- Monitoring: reporting summary, freshness filter, deployment dates and six-item pagination. Freshness never changes project status.
- Reports: employee search and role filter; Send reminder opens the existing notification composer.
- Users: avatars, actual account/role counts, access filter and ID-based You badge.
- Activity: exact date groups in Philippine time.
- Settings: profile summary, consistent form and Save changes; original tabs and handlers retained.
- Dashboard: shared surfaces and typography; original live data and actions retained.

## Run locally

From the workpulse folder:

```bash
npm ci
npm run dev
```

Build for Netlify:

```bash
npm run build
```

The ZIP includes a rebuilt dist folder. Deploy its contents to the existing Netlify site. No database migration is needed. The environment configuration supplied in the original project is preserved. node_modules and Git history are omitted.

## Validation

Production build, PWA precache generation, all 25 existing tests and component render checks passed. Run render checks with npm run test:ui. Signed-in browser visual inspection was unavailable; generated design reference pictures are conceptual, not runtime screenshots.

## v3 — Project history modal

Project tables History opens a scrollable modal with action, actor and Philippine timestamp. Close using the X, Close, Escape or backdrop. Keyboard focus returns to History. The existing latest-200-events data limit and project filter remain unchanged.

## v4 — Sidebar profile overlap fix

The profile uses fixed 36px avatar/logout tracks and a flexible text track. Long names and usernames truncate with ellipsis and expose their full text on hover. Minimized sidebar keeps logout accessible.

## v5 — Enhanced sidebar and Pink mode

Sidebar uses initials avatar, consistent navigation badges and separate truncated identity/logout tracks. Appearance offers Light, Dark and Pink. Pink uses rose accents, blush backgrounds and readable plum text; status colors retain their meaning. Theme preference persists locally; the topbar cycles Light → Dark → Pink → Light.

Production/PWA build and 27 tests passed. Browser visual inspection remains unavailable.
