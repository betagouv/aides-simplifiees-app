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
