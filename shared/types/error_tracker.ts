/**
 * Error tracking interface
 * Provides a consistent API for error tracking across the application
 * Can be implemented with Sentry, LogRocket, or other services
 */
export interface ErrorTracker {
  /**
   * Capture an error with optional context
   */
  captureError: (error: Error, context?: Record<string, unknown>) => void

  /**
   * Capture a message at different severity levels
   */
  captureMessage: (message: string, level: 'info' | 'warning' | 'error') => void

  /**
   * Set user context for error tracking
   */
  setUser: (user: { id: string | number, email?: string }) => void

  /**
   * Clear user context
   */
  clearUser: () => void
}

/**
 * Console-based error tracker (default implementation)
 * Logs errors to console - useful for development
 * In production, replace with a real service like Sentry
 */
export class ConsoleErrorTracker implements ErrorTracker {
  captureError(error: Error, context?: Record<string, unknown>): void {
    console.error('[ErrorTracker] Error captured:', error)
    if (context) {
      console.error('[ErrorTracker] Context:', context)
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void {
    const logFn = level === 'info' ? console.log : level === 'warning' ? console.warn : console.error
    logFn(`[ErrorTracker] ${level.toUpperCase()}:`, message)
  }

  setUser(user: { id: string | number, email?: string }): void {
    console.log('[ErrorTracker] User set:', user)
  }

  clearUser(): void {
    console.log('[ErrorTracker] User cleared')
  }
}
