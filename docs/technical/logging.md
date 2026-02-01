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
The application provides an error tracking infrastructure integrated with Sentry for production error monitoring. The implementation uses a pluggable interface that automatically selects the appropriate tracker based on environment.

### Core Components
- **Interface**: `ErrorTracker` (`shared/types/error_tracker.ts`)
- **Console Implementation**: `ConsoleErrorTracker` (same file) - used in development
- **Sentry Implementation**: `SentryErrorTracker` (`inertia/utils/sentry_tracker.ts`) - used in production
- **Frontend Utility**: `captureError`, `captureMessage` (`inertia/utils/error_tracker.ts`)
- **Backend Integration**: `HttpExceptionHandler` (`app/exceptions/handler.ts`)

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

### Sentry Configuration
Sentry is automatically enabled when the `SENTRY_DSN` environment variable is set.

#### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `SENTRY_DSN` | Sentry project DSN | Yes (for production) |

#### Frontend Initialization
Sentry is initialized in `inertia/app/app.ts` when the DSN is provided. The configuration includes:
- Browser tracing integration for performance monitoring
- Environment-based sample rates (10% in production, 100% in development)
- Automatic filtering of sensitive headers (authorization, cookies)

#### Backend Initialization
The backend exception handler (`app/exceptions/handler.ts`) initializes Sentry when:
- `SENTRY_DSN` is set
- Application is running in production mode

All unhandled exceptions are automatically captured with user context and request details.

### Error Boundary
The `ErrorBoundary` Vue component (`inertia/components/ErrorBoundary.vue`) captures component-level errors and reports them to Sentry automatically.

```vue
<ErrorBoundary fallback-message="Something went wrong">
  <YourComponent />
</ErrorBoundary>
```

