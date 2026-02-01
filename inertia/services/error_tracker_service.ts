import { captureError, captureMessage, getErrorTrackerInstance } from '~/utils/error_tracker'

/**
 * Frontend error tracker instance
 * Uses Sentry in production, console-based tracking in development
 */
export { getErrorTrackerInstance as getErrorTracker }

/**
 * Initialize error tracking with user context
 */
export function initErrorTracking(user?: { id: string | number, email?: string }) {
  if (user) {
    getErrorTrackerInstance().setUser(user)
  }
}

/**
 * Track a caught error with context
 */
export function trackError(error: Error, context?: Record<string, unknown>) {
  captureError(error, context)
}

/**
 * Track a message
 */
export function trackMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  captureMessage(message, level)
}
