import type { HttpContext } from '@adonisjs/core/http'
import type { Logger } from '@adonisjs/core/logger'
import { hrtime } from 'node:process'
import { inject } from '@adonisjs/core'
import string from '@adonisjs/core/helpers/string'
import logger from '@adonisjs/core/services/logger'

/**
 * Performance timer for measuring operation duration
 */
export class PerformanceTimer {
  private startTime: [number, number]
  private loggerInstance: Logger
  private operationName: string
  private context?: any

  constructor(operationName: string, loggerInstance: Logger, context?: any) {
    this.operationName = operationName
    this.loggerInstance = loggerInstance
    this.context = context
    this.startTime = hrtime()
  }

  /**
   * Stop the timer and log the duration
   */
  stop(additionalContext?: any): void {
    const duration = hrtime(this.startTime)
    const prettyDuration = string.prettyHrTime(duration)

    this.loggerInstance.info({
      operation: this.operationName,
      duration: prettyDuration,
      durationMs: duration[0] * 1000 + duration[1] / 1000000,
      ...this.context,
      ...additionalContext,
    }, `Operation '${this.operationName}' completed in ${prettyDuration}`)
  }

  /**
   * Stop the timer and log with custom message
   */
  stopWithMessage(message: string, additionalContext?: any): void {
    const duration = hrtime(this.startTime)
    const prettyDuration = string.prettyHrTime(duration)

    this.loggerInstance.info({
      operation: this.operationName,
      duration: prettyDuration,
      durationMs: duration[0] * 1000 + duration[1] / 1000000,
      ...this.context,
      ...additionalContext,
    }, message)
  }
}

/**
 * Enhanced logging service with additional utilities
 */
@inject()
export default class LoggingService {
  constructor(protected loggerInstance: Logger) {}

  /**
   * Create a performance timer for measuring operation duration
   */
  startTimer(operationName: string, context?: any): PerformanceTimer {
    return new PerformanceTimer(operationName, this.loggerInstance, context)
  }

  /**
   * Log structured API request information
   */
  logApiRequest(ctx: HttpContext, additionalContext?: any): void {
    const apiLogger = logger.use('api')

    apiLogger.info({
      requestId: ctx.request.id(),
      method: ctx.request.method(),
      url: ctx.request.url(true),
      userAgent: ctx.request.header('user-agent'),
      ip: ctx.request.ip(),
      userId: ctx.auth?.user?.id,
      userEmail: ctx.auth?.user?.email,
      referer: ctx.request.header('referer'),
      ...additionalContext,
    }, `API Request: ${ctx.request.method()} ${ctx.request.url()}`)
  }

  /**
   * Log structured API response information
   */
  logApiResponse(ctx: HttpContext, statusCode: number, additionalContext?: any): void {
    const apiLogger = logger.use('api')

    apiLogger.info({
      requestId: ctx.request.id(),
      method: ctx.request.method(),
      url: ctx.request.url(true),
      statusCode,
      userId: ctx.auth?.user?.id,
      responseTime: ctx.response.getHeader('X-Response-Time'),
      ...additionalContext,
    }, `API Response: ${ctx.request.method()} ${ctx.request.url()} - ${statusCode}`)
  }

  /**
   * Log security events
   */
  logSecurityEvent(event: string, ctx: HttpContext, additionalContext?: any): void {
    const securityLogger = logger.use('security')

    securityLogger.warn({
      event,
      requestId: ctx.request.id(),
      method: ctx.request.method(),
      url: ctx.request.url(true),
      userAgent: ctx.request.header('user-agent'),
      ip: ctx.request.ip(),
      userId: ctx.auth?.user?.id,
      userEmail: ctx.auth?.user?.email,
      timestamp: new Date().toISOString(),
      ...additionalContext,
    }, `Security Event: ${event}`)
  }

  /**
   * Log authentication attempts
   */
  logAuthAttempt(event: 'login_attempt' | 'login_success' | 'login_failure' | 'logout', ctx: HttpContext, additionalContext?: any): void {
    const securityLogger = logger.use('security')

    const logLevel = event === 'login_failure' ? 'warn' : 'info'

    securityLogger[logLevel]({
      event,
      requestId: ctx.request.id(),
      ip: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent'),
      userId: ctx.auth?.user?.id,
      userEmail: ctx.auth?.user?.email,
      timestamp: new Date().toISOString(),
      ...additionalContext,
    }, `Authentication: ${event}`)
  }

  /**
   * Log database operations
   */
  logDatabaseOperation(operation: string, table: string, additionalContext?: any): void {
    this.loggerInstance.debug({
      type: 'database',
      operation,
      table,
      timestamp: new Date().toISOString(),
      ...additionalContext,
    }, `Database: ${operation} on ${table}`)
  }

  /**
   * Log external API calls
   */
  logExternalApiCall(service: string, endpoint: string, method: string, additionalContext?: any): void {
    this.loggerInstance.info({
      type: 'external_api',
      service,
      endpoint,
      method,
      timestamp: new Date().toISOString(),
      ...additionalContext,
    }, `External API: ${method} ${service}${endpoint}`)
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetric(metric: string, value: number, unit: string, additionalContext?: any): void {
    const performanceLogger = logger.use('performance')

    performanceLogger.info({
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
      ...additionalContext,
    }, `Performance: ${metric} = ${value}${unit}`)
  }

  /**
   * Log business logic events
   */
  logBusinessEvent(event: string, additionalContext?: any): void {
    this.loggerInstance.info({
      type: 'business_event',
      event,
      timestamp: new Date().toISOString(),
      ...additionalContext,
    }, `Business Event: ${event}`)
  }

  /**
   * Log errors with full context
   */
  logError(error: Error, ctx?: HttpContext, additionalContext?: any): void {
    this.loggerInstance.error({
      err: error,
      requestId: ctx?.request.id(),
      method: ctx?.request.method(),
      url: ctx?.request.url(true),
      userId: ctx?.auth?.user?.id,
      userEmail: ctx?.auth?.user?.email,
      ip: ctx?.request.ip(),
      userAgent: ctx?.request.header('user-agent'),
      timestamp: new Date().toISOString(),
      ...additionalContext,
    }, `Error: ${error.message}`)
  }

  /**
   * Log warnings with context
   */
  logWarning(message: string, ctx?: HttpContext, additionalContext?: any): void {
    this.loggerInstance.warn({
      requestId: ctx?.request.id(),
      method: ctx?.request.method(),
      url: ctx?.request.url(true),
      userId: ctx?.auth.user?.id,
      ip: ctx?.request.ip(),
      timestamp: new Date().toISOString(),
      ...additionalContext,
    }, `Warning: ${message}`)
  }

  /**
   * Log debug information
   */
  logDebug(message: string, additionalContext?: any): void {
    this.loggerInstance.debug({
      timestamp: new Date().toISOString(),
      ...additionalContext,
    }, `Debug: ${message}`)
  }

  /**
   * Log form submission events
   */
  logFormSubmission(formType: string, ctx: HttpContext, additionalContext?: any): void {
    this.loggerInstance.info({
      type: 'form_submission',
      formType,
      requestId: ctx.request.id(),
      userId: ctx.auth?.user?.id,
      ip: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent'),
      timestamp: new Date().toISOString(),
      ...additionalContext,
    }, `Form Submission: ${formType}`)
  }

  /**
   * Log simulation events
   */
  logSimulation(event: string, simulateur: string, ctx: HttpContext, additionalContext?: any): void {
    this.loggerInstance.info({
      type: 'simulation',
      event,
      simulateur,
      requestId: ctx.request.id(),
      userId: ctx.auth?.user?.id,
      ip: ctx.request.ip(),
      timestamp: new Date().toISOString(),
      ...additionalContext,
    }, `Simulation: ${event} - ${simulateur}`)
  }
}
