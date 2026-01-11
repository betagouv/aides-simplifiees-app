# Logging System

## Overview

The application uses a structured logging system built on top of AdonisJS's logger. It provides contextual, secure, and performant logging across backend components.

## Architecture

### Core Components
- **Configuration**: `config/logger.ts`
- **Service**: `LoggingService` (`app/services/enhanced_logging_service.ts`)
- **Middleware**: `RequestLoggingMiddleware` (`app/middleware/request_logging_middleware.ts`)
- **Exception Handler**: Integration in `app/exceptions/handler.ts`

## Configuration

### Specialized Loggers
Defined in `config/logger.ts`:
- **default**: General purpose
- **api**: API request/response
- **security**: Security events
- **performance**: Performance metrics
- **business**: Business logic events

### Data Redaction
Sensitive fields (`password`, `token`, `authorization`, `session`) are automatically redacted from logs.

## LoggingService Features

### Error Logging
`logError(error, ctx?, context?)`: Logs errors with stack traces, user context, and request details.

### API Logging
- `logApiRequest(ctx)`: Logs incoming API requests.
- `logApiResponse(ctx, statusCode)`: Logs outgoing API responses with timing.

### Security Logging
- `logSecurityEvent(event, ctx)`: Tracks general security events.
- `logAuthAttempt(event, ctx)`: Tracks login attempts, successes, failures, and logouts.

### Performance Logging
- `startTimer(name)`: Returns a timer object.
- `logPerformanceMetric(metric, value, unit)`: Logs precise performance data.

### Business Logging
- `logBusinessEvent(event, context)`: Tracks domain-specific events.
- `logFormSubmission(formType, ctx)`: Logs submission attempts.

## Error Tracking

### Overview
The application provides an error tracking infrastructure that can integrate with external services like Sentry. The implementation uses a pluggable interface allowing easy replacement of the default console-based tracker.

### Core Components
- **Interface**: `ErrorTracker` (`shared/types/error_tracker.ts`)
- **Backend Implementation**: `ConsoleErrorTracker` (same file)
- **Frontend Utility**: `errorTracker` singleton (`inertia/utils/error_tracker.ts`)

### ErrorTracker Interface
```typescript
interface ErrorTracker {
  captureError(error: Error, context?: Record<string, unknown>): void
  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void
  setUser(user: { id: string | number, email?: string }): void
  clearUser(): void
}
```

### Frontend Usage
```typescript
import { captureError, captureMessage } from '~/utils/error_tracker'

// Capture an error with context
captureError(error, { component: 'SimulationForm', action: 'submit' })

// Capture a message
captureMessage('User completed simulation', 'info')
```

### Sentry Integration
The error tracker is designed for easy Sentry integration. Replace the `ConsoleErrorTracker` with a Sentry implementation when ready:

```typescript
// inertia/utils/error_tracker.ts
import * as Sentry from '@sentry/vue'

export const errorTracker: ErrorTracker = {
  captureError: (error, context) => Sentry.captureException(error, { extra: context }),
  captureMessage: (message, level) => Sentry.captureMessage(message, level),
  setUser: (user) => Sentry.setUser(user),
  clearUser: () => Sentry.setUser(null),
}
```
