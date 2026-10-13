# WorkPulse — Features Guide

Complete walkthrough of every feature in WorkPulse.

## 📋 Task Management

### Overview
Tasks are the core unit of work in WorkPulse. Each task can be simple or rich, with priority, category, due date, assignees, remarks, and a full audit trail.

### Creating a Task
1. Navigate to **Tasks** from the sidebar
2. Click **+ Add Task** (top-right)
3. Fill in:
   - **Title** (required, max 100 chars)
   - **Description** (optional, max 500 chars)
   - **Priority** — High / Medium / Low
   - **Category** — Work / Personal / Urgent / Learning / Health / Finance
   - **Due Date** (optional)
   - **Assignee** (optional, comma-separated for multiple)
4. Click **Save Task**

### Views
- **List View** — traditional list with cards
- **Kanban View** — 3-column board (To Do / In Progress / Done) with drag & drop

Switch via the view toggle in the top-right of the Tasks page.

### Filters & Search
- **Date navigator** — Today / Tomorrow / This Week / All Dates
- **Filter chips** — All / Pending / Completed / Overdue / High / Medium / Low
- **Search** — by title, description, or assignee
- **Category filter** — dropdown
- **Sort** — Newest / Oldest / Due Date / Priority / A-Z

### Bulk Actions
Select multiple tasks (checkbox on each card or "Select All"), then:
- **Mark Complete** — bulk complete
- **Delete Selected** — bulk delete
- **Cancel** — clear selection

### Task Detail Modal
Click any task to open the detail modal with 3 tabs:

1. **Details** — description, priority, category, due date, assignees, created/updated timestamps
2. **Remarks** — comments with author + timestamp, paginated (10 per page)
3. **History** — full audit trail with:
   - Filter by action (All / Updates / Remarks / Status / Assignees)
   - Statistics (total changes, unique users)
   - Colored icons per action type
   - Field-level change diffs (before → after)
   - Pagination (20 per page)

### Remarks
- Add remarks (max 500 chars)
- Each remark shows: author, timestamp, text
- Delete your own remarks (hover to reveal trash icon)
- Paginated loading (10 at a time)

### Audit Trail
Every change is logged automatically:
- **Created** — when task is added
- **Updated** — field-level changes (priority, due date, etc.)
- **Completed** / **Reopened** — status changes
- **Remark added** — new comments
- **Assignee added** / **removed**

### Kanban Board
- **3 columns:** To Do / In Progress / Done
- **Drag & drop** cards between columns
- **Auto-sync** with `done` field (dragging to Done marks complete)
- **Persistent** — column state saved to localStorage
- **Toast notifications** on successful moves

---

## 🎫 Ticket Monitoring

### Overview
The Ticket module is designed for **support and project ticket tracking**, with automatic aging computation, CSV import/export, and a dedicated Kanban board.

### Two Task Types
- **Support Task** — for client support tickets (with aging)
- **Project Task** — for internal project work

Switch between types via the tabs at the top of the Tickets page.

### Creating a Ticket
1. Navigate to **Tickets** from the sidebar
2. Choose the tab (Support / Project)
3. Click **+ New Ticket**
4. Fill in:
   - **Ticket No.** — auto-generated (next available), editable
   - **Client Name** (required)
   - **Subject** — short title
   - **Remarks** — description
   - **Status** — Open / Hypercare / In Progress / Closed / On Hold
   - **Priority** — Critical / High / Medium / Low
   - **Category** — Explanation / Bug / Enhancement / Customization
   - **Pending To** — Client / Jeonsoft / combinations
   - **Timeline** — target date
   - **Date Created** — auto-filled with now
   - **Date Last Update** — optional
5. Click **Create Ticket**

### Aging (Auto-computed)
The "aging" of each ticket is automatically computed based on `dateCreated`:
- **Today** — created today
- **1-3 Days** — 1 to 3 days old
- **4-7 Days** — 4 to 7 days old
- **More than a Week Ago** — 8 to 30 days old
- **More than a Month Ago** — 1 to 6 months
- **More than 6 Months** — 6 to 12 months
- **More than a Year** — 12+ months

Aging is displayed with color coding (green → yellow → red) based on urgency.

### Stats
The Tickets page shows 5 stat cards:
- **Total Tickets**
- **Open**
- **In Progress**
- **Hypercare**
- **Closed**

### Filters & Search
- **Search** — by ticket no, client, subject, remarks
- **Status filter** — dropdown
- **Category filter** — dropdown
- **Pending To filter** — dropdown
- **Aging filter** — dropdown
- **Sort** — Newest / Oldest / Ticket No (High→Low) / Ticket No (Low→High) / Client (A-Z)

### CSV Import
1. Click **Import** button
2. Choose:
   - **Paste from spreadsheet** — copy rows from Google Sheets / Excel
   - **Upload CSV file** — choose a `.csv` file
3. Preview shows:
   - First 10 rows
   - Valid count vs duplicate count
   - Duplicates detected by matching Ticket No.
4. Click **Import (n)** — duplicates are skipped

**Supported columns (auto-detected):**
- Ticket No. / TicketNo / Ticket # / No
- Client Name / Client / Company
- Subject / Title / Issue
- Remarks / Notes / Description
- Status / State
- Priority / Urgency
- Category / Type
- Pending To / Assigned To
- Timeline / Target Date / Due Date
- Date Created / Created / Created At
- Date Last Update / Last Update / Updated At

### CSV Export
1. Apply any filters you want
2. Click **Export** button
3. Downloads `workpulse-tickets-{date}.csv`
4. Export includes only the **filtered** tickets

### Ticket Detail Modal
Click any ticket to open the detail modal with 3 tabs:

1. **Details** — all ticket fields + aging badge
2. **Remarks** — comments (same as tasks)
3. **History** — audit trail with filters + stats

### Kanban Board (Tickets)
- **3 columns:** Open / In Progress / Closed
- **Drag & drop** tickets between columns
- **Auto-sync** with `status` field
- **Toast notifications** on successful moves

---

## 📅 Meeting Management

### Overview
Meetings can be scheduled as **remote** or **physical**, with platform-specific fields, attendees, agenda, and MOM (Minutes of Meeting) generation.

### Creating a Meeting
1. Navigate to **Meetings** from the sidebar
2. Click **+ New Meeting**
3. Fill in:
   - **Meeting Title** (required)
   - **Date** + **Time** (required)
   - **Meeting Type** — Online / On-site
   - **Platform** (for online) — Zoom / Teams / Google Meet / Viber / AnyDesk / TeamViewer
   - **Location** (for on-site)
   - **Link** (for online)
   - **Credentials** (for AnyDesk / TeamViewer)
   - **Attendees** — add multiple
   - **Agenda items** — add multiple
4. Click **Schedule Meeting**

### MOM (Minutes of Meeting)
After a meeting, generate MOM from a template:
1. Click **End Meeting & MOM** on the meeting card
2. The MOM editor opens with a pre-filled template
3. Edit as needed
4. Save — MOM is attached to the meeting

### MOM Templates
Customize the MOM template in **MOM Templates** page:
- Edit template with placeholder variables:
  - `{title}`, `{date}`, `{time}`, `{type}`, `{platform}`, `{location}`, `{link}`, `{credentials}`, `{attendees}`, `{agenda}`
- Reset to default template anytime
- Live preview

### Filters
- **Search** — by title
- **Filter** — All / Upcoming / Past / Completed / Remote / Physical

---

## 📦 Items Tracker

### Overview
Items are flexible tracking units for monitoring, projects, issues, or custom requests.

### Item Types
- **Monitoring** — server/service monitoring (icon: `fa-server`)
- **Project** — project tracking (icon: `fa-briefcase`)
- **Issue** — bug/incident tracking (icon: `fa-bug`)
- **Custom Request** — client requests (icon: `fa-clipboard-list`)

### Creating an Item
1. Navigate to **Items** from the sidebar
2. Choose the type tab
3. Click **+ Add Item**
4. Fill in:
   - **Item Type** (required)
   - **Title** (required)
   - **Reference** — e.g., TICKET-1234
   - **Status** — Pending / In Progress / For Review / Completed / On Hold / Cancelled
   - **Priority** — Critical / High / Medium / Low
   - **Next Check-in** — date for follow-up
   - **Notes / Description**
   - **Tags** — multiple
5. Click **Save Item**

### Check-in Log
Each item has a check-in log:
1. Click **Check-in** on an item
2. Add a note + optional next check-in date
3. Check-in history is displayed in the detail modal

### Status Workflow
- **Pending** → **In Progress** → **For Review** → **Completed**
- Can also move to **On Hold** or **Cancelled**

---

## 🎨 Productivity Features

### Command Palette (Ctrl+K)
Quick access to everything:
- **Navigation** — jump to any page
- **Actions** — add task, schedule meeting, add item, toggle theme
- **Search** — tasks, meetings, items by title/description
- **Keyboard navigation** — ↑↓ to select, Enter to run, Esc to close

**Trigger:** `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac), or click the search bar in the topbar.

### Notification Center
Auto-generated alerts for:
- **Overdue tasks** — tasks past their due date
- **Tasks due today**
- **Upcoming meetings** — within 24 hours
- **Check-in overdue** — items past their next check-in
- **Check-in due soon** — within 2 days

**Features:**
- Badge count on the bell icon
- Click a notification → navigate to the relevant item + open detail modal
- **Mark as read** — clears the blue dot
- **Dismiss** — permanently remove a notification
- **Mark all read** — clears all badges
- **Clear all** — dismisses everything
- **Persistent** — read/dismissed state saved to localStorage
- **Auto-cleanup** — stale notifications removed when the underlying item is deleted/completed

### Activity Log
Global feed of all changes across modules:
- **Filter by action** — Created / Updated / Completed / Reopened / Remark / Assignee
- **Filter by user** — show only specific user's changes
- **Filter by date** — Today / This Week / This Month / All Time
- **Search** — by task title or user
- **Group by date** — Today / Yesterday / This Week / This Month / Older
- **Statistics** — total activities, showing count, active users
- **Click to navigate** — opens the relevant task detail

### Dark / Light Mode
- **Toggle** via the sun/moon icon in the topbar (or sidebar footer)
- **Smooth transition** — colors fade over 0.35s
- **Animated icon** — sun/moon rotates on toggle
- **Persistent** — saved to localStorage

### Multi-User Support
- Each user has separate data (stored per `username`)
- Default admin account: `admin` / `admin123`
- Register new accounts via the Register page
- Profile update in Settings (name, email)

### Settings
- **Profile** — update name, email
- **Appearance** — theme (light/dark)
- **Data** — export all data (JSON), clear all data
- **Account** — logout

---

## 📱 PWA (Progressive Web App)

### Install
- **Desktop (Chrome/Edge):** Install button in the topbar, or browser menu → "Install WorkPulse"
- **iOS (Safari):** Share menu → "Add to Home Screen"
- **Android (Chrome):** Menu → "Install app"

### Offline Mode
- Service worker caches app shell + lazy-loaded pages
- Works offline after first load
- Offline indicator in the topbar
- User-initiated updates (banner appears when new version available)

### Testing PWA Locally
PWA features require a production build:

```bash
npm run build
npm run preview