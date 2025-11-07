import type { ErrorTracker } from '~/../../shared/types/error_tracker'
import { ConsoleErrorTracker } from '~/../../shared/types/error_tracker'

/**
 * Frontend error tracker instance
 * Currently uses console-based tracking
 * TODO: Replace with Sentry or other service in production
 */
export const errorTracker: ErrorTracker = new ConsoleErrorTracker()

/**
 * Initialize error tracking with user context
 */
export function initErrorTracking(user?: { id: string | number, email?: string }) {
  if (user) {
    errorTracker.setUser(user)
  }
}

/**
 * Track a caught error with context
 */
export function trackError(error: Error, context?: Record<string, unknown>) {
  errorTracker.captureError(error, context)
}

/**
 * Track a message
 */
export function trackMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  errorTracker.captureMessage(message, level)
}
