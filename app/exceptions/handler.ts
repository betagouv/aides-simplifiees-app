import type { HttpContext } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'
import process from 'node:process'
import { ExceptionHandler } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export default class HttpExceptionHandler extends ExceptionHandler {
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

    return super.report(error, ctx)
  }
}
