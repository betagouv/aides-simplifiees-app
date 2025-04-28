import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

/**
 * Middleware to share environment variables with the Inertia client
 */
export default class ShareEnvMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Only share specific environment variables that are needed on the client
    const matomoUrl = env.get('MATOMO_URL')
    const matomoSiteId = env.get('MATOMO_SITE_ID')
    ctx.inertia.share({
      ... matomoUrl ? { matomoUrl } : {},
      ... matomoSiteId ? { matomoSiteId } : {},
    })

    await next()
  }
}
