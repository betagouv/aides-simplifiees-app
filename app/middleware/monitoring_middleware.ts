import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'
import app from '@adonisjs/core/services/app'

/**
 * Middleware to protect monitoring endpoints with a secret
 * In development, allows access without secret
 * In production/staging, requires x-monitoring-secret header
 */
export default class MonitoringMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    // Allow health checks without secret in development
    if (!app.inProduction) {
      return next()
    }

    // In production/staging, require monitoring secret header
    const monitoringSecret = env.get('MONITORING_SECRET')
    const providedSecret = request.header('x-monitoring-secret')

    if (monitoringSecret && providedSecret === monitoringSecret) {
      return next()
    }

    return response.unauthorized({ message: 'Unauthorized access' })
  }
}
