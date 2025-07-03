import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import LoggingService from '#services/logging_service'

/**
 * Middleware to preserve the 'iframe' query parameter from the referer URL
 * to the current request URL.
 */
export default class PreserveIframeParamMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx
    const referer = request.header('referer')
    // Continue if there's no referer
    if (!referer) {
      return next()
    }

    try {
      const refererUrl = new URL(referer)
      const currentIframe = request.qs().iframe
      const refererIframe = refererUrl.searchParams.get('iframe')

      // Only redirect if the referer had iframe but current request doesn't
      if (refererIframe === 'true' && !currentIframe) {
        return response
          .redirect()
          .withQs() // Preserve existing query string
          .withQs({
            iframe: 'true',
          })
          .toPath(request.url())
      }
    }
    catch (error) {
      const loggingService = new LoggingService(ctx.logger)
      loggingService.logError(error as Error, ctx, {
        referer,
        url: request.url(),
        method: request.method(),
        userAgent: request.header('user-agent'),
      })
    }

    await next()
  }
}
