import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { NotificationExperience } from './context/NotificationExperience.jsx'
import './styles/notification-alerts.css'
import App from './App.jsx'

// Global styles
import './styles/globals.css'
import './styles/components.css'
import './styles/layout.css'
import './styles/polish.css'
import './styles/pwa.css'
import './styles/notification-ui.css';
import { startPwa } from './pwa/client.js'

import './styles/ui-refresh.css'
<<<<<<< HEAD
// Load module styles once before the shared contract so lazy navigation cannot
// change the cascade or reset sizes on a subsequent page visit.
import './styles/settings-workspace.css'
import './styles/projects.css'
import './styles/project-monitoring.css'
import './styles/admin-panel.css'
import './styles/dashboard-interactive.css'
import './styles/project-picker.css'
import './styles/employee-report.css'
import './styles/project-reports.css'
import './styles/unified-ui.css'
=======
>>>>>>> cfe308f0e4c7181f662947f40efa60a124262d45

// Context Providers
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppDataProvider } from './context/AppDataContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'

startPwa()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppDataProvider>
              <NotificationProvider>
                <NotificationExperience>
                  <App />
                </NotificationExperience>
              </NotificationProvider>
            </AppDataProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
