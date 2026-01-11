/**
 * Frontend error tracking utility
 * Exports a singleton instance for use throughout the frontend
 */

import type { ErrorTracker } from '../../shared/types/error_tracker'
import { ConsoleErrorTracker } from '../../shared/types/error_tracker'

/**
 * Global error tracker instance
 * Uses ConsoleErrorTracker by default
 * Replace with Sentry implementation when ready:
 *
 * @example
 * // To replace with Sentry:
 * // import * as Sentry from '@sentry/vue'
 * // export const errorTracker: ErrorTracker = {
 * //   captureError: (error, context) => Sentry.captureException(error, { extra: context }),
 * //   captureMessage: (message, level) => Sentry.captureMessage(message, level),
 * //   setUser: (user) => Sentry.setUser(user),
 * //   clearUser: () => Sentry.setUser(null),
 * // }
 */
export const errorTracker: ErrorTracker = new ConsoleErrorTracker()

/**
 * Convenience function to capture errors with context
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  errorTracker.captureError(error, context)
}

/**
 * Convenience function to capture messages
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  errorTracker.captureMessage(message, level)
}
