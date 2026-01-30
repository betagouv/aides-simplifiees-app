/**
 * Frontend error tracking utility
 * Exports a singleton instance for use throughout the frontend
 */

import type { ErrorTracker } from '../../shared/types/error_tracker'
import { ConsoleErrorTracker } from '../../shared/types/error_tracker'
import { isSentryEnabled, SentryErrorTracker } from './sentry_tracker'

/**
 * Get the appropriate error tracker based on environment
 * Uses SentryErrorTracker when Sentry is initialized, otherwise falls back to console
 */
function getErrorTracker(): ErrorTracker {
  // Use Sentry if it's been initialized (happens in app.ts for production)
  if (isSentryEnabled()) {
    return new SentryErrorTracker()
  }
  // Fallback to console logging for development or when Sentry is not configured
  return new ConsoleErrorTracker()
}

/**
 * Global error tracker instance
 * Lazy-initialized to ensure Sentry is initialized first
 */
let errorTrackerInstance: ErrorTracker | null = null

export function getErrorTrackerInstance(): ErrorTracker {
  if (!errorTrackerInstance) {
    errorTrackerInstance = getErrorTracker()
  }
  return errorTrackerInstance
}

/**
 * Reset the error tracker instance (useful after Sentry initialization)
 */
export function resetErrorTracker(): void {
  errorTrackerInstance = null
}

/**
 * Convenience function to capture errors with context
 */
export function captureError(error: Error, context?: Record<string, unknown>): void {
  getErrorTrackerInstance().captureError(error, context)
}

/**
 * Convenience function to capture messages
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  getErrorTrackerInstance().captureMessage(message, level)
}

/**
 * @deprecated Use getErrorTrackerInstance() instead for lazy initialization
 */
export const errorTracker: ErrorTracker = new ConsoleErrorTracker()
