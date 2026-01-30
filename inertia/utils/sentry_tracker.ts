/**
 * Sentry error tracker implementation
 * Implements the ErrorTracker interface using Sentry SDK
 */

import type { App } from 'vue'
import type { ErrorTracker } from '../../shared/types/error_tracker'
import * as Sentry from '@sentry/vue'

/**
 * Initialize Sentry for Vue application
 * Should be called once during app initialization
 */
export function initSentry(app: App, options: {
  dsn: string
  environment: string
  release?: string
}) {
  Sentry.init({
    app,
    dsn: options.dsn,
    environment: options.environment,
    release: options.release,

    // Performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // Adjust in production based on traffic volume.
    tracesSampleRate: options.environment === 'production' ? 0.1 : 1.0,

    // Capture Replay sessions on errors
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: options.environment === 'production' ? 1.0 : 0,

    // Don't send events in development by default
    enabled: options.environment !== 'development',

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization
        delete event.request.headers.cookie
      }
      return event
    },
  })
}

/**
 * Sentry-based error tracker implementation
 */
export class SentryErrorTracker implements ErrorTracker {
  captureError(error: Error, context?: Record<string, unknown>): void {
    Sentry.captureException(error, {
      extra: context,
    })
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void {
    Sentry.captureMessage(message, level)
  }

  setUser(user: { id: string | number, email?: string }): void {
    Sentry.setUser({
      id: String(user.id),
      email: user.email,
    })
  }

  clearUser(): void {
    Sentry.setUser(null)
  }
}

/**
 * Check if Sentry is initialized and enabled
 */
export function isSentryEnabled(): boolean {
  return Sentry.getClient() !== undefined
}
