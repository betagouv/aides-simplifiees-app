import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

/**
 * Middleware to share environment variables with the Inertia client
 */
export default class ShareEnvMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Only share specific environment variables that are needed on the client
    ctx.inertia.share(filterObject({
      appName: env.get('APP_NAME'),
      publicAppUrl: env.get('PUBLIC_APP_URL'),
      matomoUrl: env.get('MATOMO_URL'),
      matomoSiteId: env.get('MATOMO_SITE_ID'),
    }))

    await next()
  }
}

/**
 * Filters out undefined and null values from an object
 */
function filterObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const filtered: Partial<T> = {}
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      filtered[key] = obj[key]
    }
  }
  return filtered
}
