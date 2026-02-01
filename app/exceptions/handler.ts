/* eslint-disable perfectionist/sort-imports */
import process from 'node:process'
import type { HttpContext } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'
import { ExceptionHandler } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import { errors as vinErrors } from '@vinejs/vine'
import * as Sentry from '@sentry/node'
import LoggingService from '#services/logging_service'
import env from '#start/env'

export default class HttpExceptionHandler extends ExceptionHandler {
  private loggingService: LoggingService
  private sentryInitialized: boolean = false

  constructor() {
    super()
    this.loggingService = new LoggingService(logger)
    this.initSentry()
  }

  /**
   * Initialize Sentry for backend error tracking
   */
  private initSentry() {
    const sentryDsn = env.get('SENTRY_DSN')
    if (sentryDsn && app.inProduction) {
      Sentry.init({
        dsn: sentryDsn,
        environment: env.get('APP_ENV'),
        // Set tracesSampleRate to capture transactions for performance monitoring
        tracesSampleRate: 0.1,
        // Filter out sensitive data
        beforeSend(event) {
          if (event.request?.headers) {
            delete event.request.headers.authorization
            delete event.request.headers.cookie
          }
          return event
        },
      })
      this.sentryInitialized = true
    }
  }

  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * Status pages are used to display a custom HTML pages for certain error
   * codes. You might want to enable them in production only, but feel
   * free to enable them in development as well.
   */
  protected renderStatusPages = app.inProduction || process.env.NODE_ENV === 'test'

  /**
   * Status pages is a collection of error code range and a callback
   * to return the HTML contents to send as a response.
   */
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (error, { inertia, response }) => {
      response.status(404)
      return inertia.render('error', {
        statusCode: 404,
        message: app.inProduction
          ? 'Page non trouvée'
          : error.message,
      })
    },
    '500..599': (error, { inertia, response }) => {
      // Use 500 status code for all server errors
      const statusCode = 500
      response.status(statusCode)
      return inertia.render('error', {
        statusCode,
        message: app.inProduction
          ? 'Une erreur est survenue, veuillez réessayer plus tard.'
          : error.message,
      })
    },
  }

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    // Handle validation errors from VineJS
    if (error instanceof vinErrors.E_VALIDATION_ERROR) {
      this.loggingService.logWarning('Validation error occurred', ctx, {
        validationErrors: error.messages,
        errorCode: 'E_VALIDATION_ERROR',
      })
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    if (process.env.NODE_ENV === 'test') {
      return
    }

    // Report to Sentry if initialized
    if (this.sentryInitialized && error instanceof Error) {
      Sentry.captureException(error, {
        extra: this.context(ctx),
        user: ctx.auth?.user
          ? {
              id: String(ctx.auth.user.id),
              email: ctx.auth.user.email,
            }
          : undefined,
      })
    }

    // Use enhanced logging service for better error reporting
    if (error instanceof Error) {
      this.loggingService.logError(error, ctx, {
        stack: error.stack,
        errorName: error.name,
        errorCode: (error as any).code,
        status: (error as any).status,
        context: this.context(ctx),
      })
    }
    else {
      // Handle non-Error objects
      this.loggingService.logError(new Error('Unknown error type'), ctx, {
        originalError: String(error),
        errorType: typeof error,
        context: this.context(ctx),
      })
    }

    return super.report(error, ctx)
  }

  /**
   * Get additional context for error reporting
   */
  protected context(ctx: HttpContext) {
    return {
      requestId: ctx.request.id(),
      userId: ctx.auth?.user?.id,
      userEmail: ctx.auth?.user?.email,
      ip: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent'),
      method: ctx.request.method(),
      url: ctx.request.url(true),
      referer: ctx.request.header('referer'),
    }
  }
}
