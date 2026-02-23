/**
 * Sentry Configuration
 * Error tracking and monitoring setup
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initializeSentry() {
  const isDevelopment = import.meta.env.DEV;
  const isTesting = import.meta.env.VITE_ENV === 'test';

  if (isTesting) {
    // Don't initialize Sentry in test environment
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    environment: import.meta.env.VITE_ENV || 'development',
    tracesSampleRate: isDevelopment ? 1.0 : 0.01, // 1% in production
    replaysSessionSampleRate: isDevelopment ? 1.0 : 0.1, // 10% in production
    replaysOnErrorSampleRate: 1.0, // 100% on errors

    // Before sending to Sentry, scrub sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request) {
        delete event.request.headers;
      }

      // Remove auth tokens from URLs
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/token=[\w-]+/g, 'token=***');
      }

      // Remove PII from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((crumb) => {
          if (crumb.message) {
            crumb.message = crumb.message.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, '[email]');
          }
          return crumb;
        });
      }

      return event;
    },

    // Filter out known errors we don't care about
    beforeBreadcrumb(breadcrumb) {
      // Ignore resizing and similar non-critical events
      if (breadcrumb.category === 'ui.click') {
        return null;
      }
      return breadcrumb;
    },

    // Deny list for errors to ignore
    ignoreErrors: [
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'chrome-extension://',
      'moz-extension://',
    ],
  });

  console.log('Sentry initialized:', { env: import.meta.env.VITE_ENV, dsn: dsn.slice(0, 50) + '...' });
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error | string,
  context?: Record<string, any>
) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture message with level
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add custom context to error reports
 */
export function addContext(name: string, data: Record<string, any>) {
  Sentry.setContext(name, data);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
}
