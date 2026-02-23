import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './index.css'
import { initializeSentry } from './services/sentry'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastContainer } from './components/Toast/ToastContainer'

// Initialize Sentry error tracking
initializeSentry()

// Create Sentry-wrapped React Router
const SentryApp = Sentry.withProfiler(App)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastContainer>
        <SentryApp />
      </ToastContainer>
    </ErrorBoundary>
  </React.StrictMode>,
)
