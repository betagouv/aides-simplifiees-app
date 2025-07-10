# Logging System Documentation

## Overview

This application uses a comprehensive, structured logging system built on top of AdonisJS's logger. The logging system provides contextual, secure, and performant logging across all backend components.

## Architecture

### Core Components

1. **Logger Configuration** (`config/logger.ts`)
2. **LoggingService** (`app/services/enhanced_logging_service.ts`)
3. **Request Logging Middleware** (`app/middleware/request_logging_middleware.ts`)
4. **Exception Handler Integration** (`app/exceptions/handler.ts`)

## Configuration

### Logger Setup (`config/logger.ts`)

The logger is configured with multiple specialized loggers and sensitive data redaction:

```typescript
// Multiple loggers for different concerns
loggers: {
  default: { /* General purpose logging */ },
  api: { /* API request/response logging */ },
  security: { /* Security events */ },
  performance: { /* Performance metrics */ },
  business: { /* Business logic events */ }
}

// Sensitive data redaction
redact: {
  paths: ['password', 'token', 'authorization', 'cookie', 'session'],
  remove: true
}
```

### Log Levels

- **error**: Critical errors that need immediate attention
- **warn**: Warning conditions that should be monitored
- **info**: General information about application flow
- **debug**: Detailed information for debugging (development only)

## LoggingService

### Core Methods

#### Error Logging
```typescript
logError(error: Error, ctx?: HttpContext, additionalContext?: any): void
```
Logs errors with full context including request information, user details, and stack traces.

#### API Logging
```typescript
logApiRequest(ctx: HttpContext, additionalContext?: any): void
logApiResponse(ctx: HttpContext, statusCode: number, additionalContext?: any): void
```
Structured logging for API requests and responses with performance metrics.

#### Security Logging
```typescript
logSecurityEvent(event: string, ctx: HttpContext, additionalContext?: any): void
logAuthAttempt(event: 'login_attempt' | 'login_success' | 'login_failure' | 'logout', ctx: HttpContext, additionalContext?: any): void
```
Tracks security-related events and authentication attempts.

#### Performance Logging
```typescript
startTimer(operationName: string, context?: any): PerformanceTimer
logPerformanceMetric(metric: string, value: number, unit: string, additionalContext?: any): void
```
Measures and logs operation performance with high precision timing.

#### Business Event Logging
```typescript
logBusinessEvent(event: string, additionalContext?: any): void
logFormSubmission(formType: string, ctx: HttpContext, additionalContext?: any): void
```
Tracks business-critical events and form submissions.

#### Database & External API Logging
```typescript
logDatabaseOperation(operation: string, table: string, additionalContext?: any): void
logExternalApiCall(service: string, endpoint: string, method: string, additionalContext?: any): void
```
Logs database operations and external API calls for monitoring and debugging.

## Usage Examples

### In Controllers

```typescript
import LoggingService from '#services/enhanced_logging_service'

export default class AuthController {
  constructor(private loggingService: LoggingService) {}

  async login({ auth, request, response }: HttpContext) {
    const timer = this.loggingService.startTimer('user_login')

    try {
      // Authentication logic
      await auth.use('web').login(user)

      this.loggingService.logAuthAttempt('login_success', { auth, request, response }, {
        userId: user.id,
        userEmail: user.email,
        loginMethod: 'email'
      })

      timer.end('Login successful')
      return response.redirect('/dashboard')
    }
    catch (error) {
      this.loggingService.logAuthAttempt('login_failure', { auth, request, response }, {
        email: request.input('email'),
        reason: error.message
      })

      timer.end('Login failed')
      throw error
    }
  }
}
```

### In Services

```typescript
import LoggingService from '#services/enhanced_logging_service'

export default class MatomoReportingService {
  constructor(private loggingService: LoggingService) {}

  async trackEvent(eventData: any) {
    const timer = this.loggingService.startTimer('matomo_track_event')

    try {
      this.loggingService.logExternalApiCall('matomo', '/matomo.php', 'POST', {
        eventCategory: eventData.category,
        eventAction: eventData.action
      })

      // API call logic
      const response = await fetch(/* ... */)

      timer.end('Event tracked successfully')
      return response
    }
    catch (error) {
      this.loggingService.logError(error, undefined, {
        service: 'matomo',
        operation: 'track_event',
        eventData
      })

      timer.end('Event tracking failed')
      throw error
    }
  }
}
```

### In Middleware

```typescript
import LoggingService from '#services/enhanced_logging_service'

export default class CustomMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      return await next()
    }
    catch (error) {
      const loggingService = new LoggingService(ctx.logger)
      loggingService.logError(error as Error, ctx, {
        middleware: 'CustomMiddleware',
        operation: 'handle'
      })
      throw error
    }
  }
}
```

## Request Logging Middleware

### Automatic Request Logging

The `RequestLoggingMiddleware` automatically logs:
- All incoming HTTP requests
- Response status codes
- Response times
- User context (when authenticated)
- Request/response headers (configurable)

### Configuration

```typescript
// In start/kernel.ts
server.use([
  // ... other middleware
  () => import('#middleware/request_logging_middleware'),
])
```

### Log Output Example

```json
{
  "level": "info",
  "time": "2025-07-03T10:30:00.000Z",
  "msg": "HTTP Request: GET /api/users",
  "requestId": "req_123456",
  "method": "GET",
  "url": "/api/users",
  "statusCode": 200,
  "responseTime": 45.23,
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.100",
  "userId": "user_789",
  "userEmail": "user@example.com"
}
```

## Error Handling Integration

### Exception Handler

The global exception handler automatically logs all errors with full context:

```typescript
// In app/exceptions/handler.ts
async handle(error: unknown, ctx: HttpContext) {
  this.loggingService.logError(error as Error, ctx, {
    handler: 'GlobalExceptionHandler',
    url: ctx.request.url(),
    method: ctx.request.method()
  })

  return super.handle(error, ctx)
}
```

## Security Features

### Sensitive Data Redaction

The logging system automatically redacts sensitive information:

- Passwords
- API tokens
- Authorization headers
- Session cookies
- Credit card numbers
- Social security numbers

### Example of Redacted Log

```json
{
  "level": "info",
  "time": "2025-07-03T10:30:00.000Z",
  "msg": "User login attempt",
  "email": "user@example.com",
  "password": "[REDACTED]",
  "token": "[REDACTED]"
}
```

## Performance Monitoring

### Performance Timers

Use performance timers to measure operation duration:

```typescript
// Start a timer
const timer = this.loggingService.startTimer('database_query', {
  table: 'users',
  operation: 'findById'
})

// Perform operation
const user = await User.find(userId)

// End timer with result
timer.end('User found successfully')
```

### Timer Output

```json
{
  "level": "info",
  "time": "2025-07-03T10:30:00.000Z",
  "msg": "Performance: database_query completed in 12.34ms",
  "operation": "database_query",
  "duration": "12.34ms",
  "durationMs": 12.34,
  "table": "users",
  "operation": "findById",
  "result": "User found successfully"
}
```

## Log Analysis and Monitoring

### Structured Logging Benefits

All logs are structured JSON, making them easily searchable and analyzable:

```bash
# Find all authentication failures
grep "login_failure" logs/app.log

# Find all slow operations (>1000ms)
grep "durationMs.*:[0-9]{4,}" logs/app.log

# Find all API errors
grep "level.*error" logs/api.log
```

### Integration with Monitoring Tools

The structured format is compatible with:
- **Elasticsearch + Kibana**: For log aggregation and visualization
- **Splunk**: For enterprise log management
- **DataDog**: For application performance monitoring
- **New Relic**: For application monitoring and alerting

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ✅ Good
this.loggingService.logError(error, ctx) // For actual errors
this.loggingService.logWarning('Rate limit exceeded', ctx) // For warnings
this.loggingService.logBusinessEvent('user_registered') // For business events

// ❌ Avoid
console.log('User registered') // Use structured logging instead
```

### 2. Include Relevant Context

```typescript
// ✅ Good
this.loggingService.logError(error, ctx, {
  userId: user.id,
  operation: 'update_profile',
  fieldUpdated: 'email'
})

// ❌ Avoid
this.loggingService.logError(error) // Missing context
```

### 3. Use Performance Timers for Critical Operations

```typescript
// ✅ Good
const timer = this.loggingService.startTimer('external_api_call')
const result = await externalService.call()
timer.end('API call completed')

// ❌ Avoid
const start = Date.now()
const result = await externalService.call()
console.log(`API call took ${Date.now() - start}ms`)
```

### 4. Log Business Events

```typescript
// ✅ Good
this.loggingService.logBusinessEvent('form_submitted', {
  formType: 'contact',
  userId: user.id,
  completionTime: timer.duration
})

// ❌ Missing business context
this.loggingService.logDebug('Form submitted')
```

### 5. Use Specific Loggers for Different Concerns

```typescript
// ✅ Good
this.loggingService.logSecurityEvent('failed_login_attempt', ctx)
this.loggingService.logApiRequest(ctx)
this.loggingService.logPerformanceMetric('database_query_time', 45.2, 'ms')

// ❌ Generic logging
logger.info('Something happened')
```

## Migration from Console Logging

### Before (Console Logging)
```typescript
console.log('User logged in:', user.email)
console.error('Database error:', error)
console.warn('Rate limit exceeded for user:', userId)
```

### After (Structured Logging)
```typescript
this.loggingService.logAuthAttempt('login_success', ctx, {
  userEmail: user.email,
  loginMethod: 'email'
})

this.loggingService.logError(error, ctx, {
  operation: 'database_query',
  table: 'users'
})

this.loggingService.logWarning('Rate limit exceeded', ctx, {
  userId,
  limit: 100,
  attempts: 150
})
```

## Environment Configuration

### Development
- Debug logs enabled
- Console output with colors
- Verbose error information

### Production
- Info level and above
- JSON format for log aggregation
- Error tracking integration
- Performance monitoring

### Configuration Example

```typescript
// config/logger.ts
export default defineConfig({
  default: env.get('NODE_ENV') === 'production' ? 'production' : 'development',

  loggers: {
    development: {
      enabled: true,
      level: env.get('LOG_LEVEL', 'debug'),
      redact: { paths: ['password', 'token'], remove: true },
      transport: {
        targets: [
          { target: 'pino-pretty', level: 'debug' },
          { target: './app/logger_transports/file_transport', level: 'info' }
        ]
      }
    },

    production: {
      enabled: true,
      level: env.get('LOG_LEVEL', 'info'),
      redact: { paths: ['password', 'token', 'authorization'], remove: true },
      transport: {
        targets: [
          { target: './app/logger_transports/file_transport', level: 'info' },
          { target: './app/logger_transports/monitoring_transport', level: 'error' }
        ]
      }
    }
  }
})
```

## Troubleshooting

### Common Issues

1. **Missing Context**: Always pass `HttpContext` when available
2. **Performance Impact**: Use appropriate log levels in production
3. **Sensitive Data**: Ensure redaction is configured correctly
4. **Log Rotation**: Configure log rotation to prevent disk space issues

### Debug Mode

Enable debug logging to see all log messages:

```bash
# Set environment variable
export LOG_LEVEL=debug

# Or in .env file
LOG_LEVEL=debug
```

## Testing

### Unit Testing with Logging

```typescript
// Test setup
const mockLogger = {
  info: sinon.stub(),
  error: sinon.stub(),
  warn: sinon.stub(),
  debug: sinon.stub()
}

const loggingService = new LoggingService(mockLogger)

// Test logging calls
it('should log authentication success', async () => {
  await authController.login(mockCtx)

  expect(mockLogger.info).to.have.been.calledWith(
    sinon.match.has('event', 'login_success')
  )
})
```

## Conclusion

This logging system provides:
- **Structured logging** for better searchability
- **Contextual information** for debugging
- **Security features** with data redaction
- **Performance monitoring** with timers
- **Scalable architecture** for different log types
- **Production-ready** configuration

The system replaces all console logging with structured, contextual logging that supports modern log analysis tools and provides better insights into application behavior.
