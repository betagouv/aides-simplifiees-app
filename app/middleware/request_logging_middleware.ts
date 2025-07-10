/* eslint-disable perfectionist/sort-imports */
import { hrtime } from 'node:process'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import string from '@adonisjs/core/helpers/string'
import logger from '@adonisjs/core/services/logger'
import LoggingService from '#services/logging_service'

/**
 * Request logging middleware that logs request details, response times,
 * and performance metrics for all HTTP requests
 */
export default class RequestLoggingMiddleware {
  private loggingService: LoggingService

  constructor() {
    this.loggingService = new LoggingService(logger)
  }

  async handle(ctx: HttpContext, next: NextFn) {
    const startTime = hrtime()

    // Log incoming request
    this.loggingService.logApiRequest(ctx, {
      headers: this.sanitizeHeaders(ctx.request.headers()),
      query: ctx.request.qs(),
      params: ctx.params,
    })

    // Add request ID header
    const requestId = ctx.request.id()
    if (requestId) {
      ctx.response.header('X-Request-ID', requestId)
    }

    try {
      // Continue to next middleware/route handler
      await next()

      // Calculate response time
      const duration = hrtime(startTime)
      const durationMs = duration[0] * 1000 + duration[1] / 1000000
      const prettyDuration = string.prettyHrTime(duration)

      // Add response time header
      ctx.response.header('X-Response-Time', `${durationMs.toFixed(2)}ms`)

      // Log successful response
      this.loggingService.logApiResponse(ctx, ctx.response.getStatus(), {
        responseTime: prettyDuration,
        responseTimeMs: durationMs,
        responseSize: ctx.response.getHeader('Content-Length'),
      })

      // Log performance metrics for slow requests (>1000ms)
      if (durationMs > 1000) {
        this.loggingService.logPerformanceMetric('slow_request', durationMs, 'ms', {
          requestId: ctx.request.id(),
          method: ctx.request.method(),
          url: ctx.request.url(true),
          userId: ctx.auth?.user?.id,
        })
      }

      // Log performance metrics for very slow requests (>5000ms)
      if (durationMs > 5000) {
        this.loggingService.logWarning('Very slow request detected', ctx, {
          responseTime: prettyDuration,
          responseTimeMs: durationMs,
        })
      }
    }
    catch (error) {
      // Calculate response time even for errors
      const duration = hrtime(startTime)
      const durationMs = duration[0] * 1000 + duration[1] / 1000000
      const prettyDuration = string.prettyHrTime(duration)

      // Add response time header
      ctx.response.header('X-Response-Time', `${durationMs.toFixed(2)}ms`)

      // Log error with full context
      this.loggingService.logError(error as Error, ctx, {
        responseTime: prettyDuration,
        responseTimeMs: durationMs,
      })

      // Re-throw the error to let the error handler deal with it
      throw error
    }
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers }

    // Remove sensitive headers
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'x-access-token',
    ]

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]'
      }
      if (sanitized[header.toLowerCase()]) {
        sanitized[header.toLowerCase()] = '[REDACTED]'
      }
    })

    return sanitized
  }
}
