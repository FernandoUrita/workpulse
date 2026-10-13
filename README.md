# WorkPulse

> A modern, offline-first productivity workspace for managing tasks, meetings, items, and support tickets — all in one place.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://myworkpulse.netlify.app)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-purple)](https://vitejs.dev)
[![PWA](https://img.shields.io/badge/PWA-installable-orange)](https://web.dev/progressive-web-apps/)

## 🎯 What is WorkPulse?

WorkPulse is a **progressive web app** designed to streamline daily work operations — from tracking support tickets and monitoring project tasks, to scheduling meetings and managing action items. Built with a focus on **speed, offline-first UX, and clean design**, it works seamlessly across desktop and mobile.

**Live Demo:** [myworkpulse.netlify.app](https://myworkpulse.netlify.app)

**Demo Credentials:**
- Username: `admin`
- Password: `admin123`

## ✨ Features

### 📋 Task Management
- Create, edit, delete, and complete tasks
- Priority levels (High / Medium / Low) with color coding
- Category tags (Work / Personal / Urgent / Learning / Health / Finance)
- Due dates with overdue detection
- Multi-assignee support (assign to multiple users)
- Remarks / comments with author + timestamp
- Audit trail (full history of changes)
- Kanban board view (drag & drop between To Do / In Progress / Done)
- List view with filters, search, and sort
- Bulk actions (mark complete, delete multiple)
- Date navigator (Today / Tomorrow / This Week / All Dates)

### 🎫 Ticket Monitoring
- Two task types: **Support Task** / **Project Task** (tabbed view)
- Auto-generated ticket numbers (editable)
- Client name, subject, remarks, category
- Status workflow (Open / Hypercare / In Progress / Closed / On Hold)
- Priority levels (Critical / High / Medium / Low)
- Pending To tracking (Client / Jeonsoft / combinations)
- **Auto-computed aging** (Today / 1-3 Days / 4-7 Days / More than a Week / Month / 6 Months / Year)
- Timeline / target date tracking
- **Kanban board** with drag & drop
- **CSV import** (paste from spreadsheet or upload file)
- **CSV export** (filtered by current view)
- Detail modal with remarks + audit trail
- Duplicate ticket detection on import

### 📅 Meeting Management
- Schedule remote or physical meetings
- Platform support (Zoom / Teams / Google Meet / Viber / AnyDesk / TeamViewer)
- Attendee list management
- Agenda items
- Meeting Minutes (MOM) generation from template
- MOM templates customization
- Status tracking (Upcoming / Past / Completed)

### 📦 Items Tracker
- Multiple item types (Monitoring / Project / Issue / Custom Request)
- Status workflow (Pending / In Progress / For Review / Completed / On Hold / Cancelled)
- Priority levels (Critical / High / Medium / Low)
- Check-in log with next check-in reminders
- Target dates with overdue detection
- Reference numbers (e.g., TICKET-1234)
- Tags support

### 🎨 UX & Productivity
- **Command Palette** (Ctrl+K) — quick search across all data + actions
- **Notification Center** — auto-generated alerts for overdue tasks, upcoming meetings, check-ins
- **Global Activity Log** — filterable feed of all changes across modules
- **Dark / Light mode** with smooth transitions
- **Multi-user support** — separate data per user account
- **Data export / import** — CSV support, JSON backup
- **PWA** — installable, offline-ready, service worker with versioned cache
- **Responsive design** — works on desktop, tablet, and mobile
- **Skeleton loaders** for smooth perceived performance
- **Empty states** with helpful CTAs

## 🛠️ Tech Stack

### Frontend
- **React 19** — UI library
- **Vite 8** — build tool + dev server
- **React Router 7** — client-side routing
- **Tailwind CSS 4** — utility-first styling (layered alongside custom CSS)
- **Motion (Framer Motion)** — animations + page transitions
- **@dnd-kit** — drag & drop for Kanban boards
- **Font Awesome 6** — icons

### Storage
- **localStorage** — per-user data persistence
- No backend required — fully client-side

### PWA
- **Service Worker** — versioned precache, offline-ready
- **Web App Manifest** — installable on desktop + mobile
- **Update flow** — user-initiated reload

### Deployment
- **Netlify** — auto-deploy from `main` branch

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/FernandoUrita/workpulse.git
cd workpulse

# Install dependencies
npm install

# Start dev server
npm run dev