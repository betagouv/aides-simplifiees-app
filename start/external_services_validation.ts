/**
 * External services validation at startup
 *
 * Validates connectivity and authentication to external services (Matomo, OpenFisca, etc.)
 * before the app starts serving requests. This prevents silent failures where the app
 * appears healthy but external integrations are broken.
 *
 * Only runs validation in production/staging environments where these services are required.
 * Failures are logged and reported to Sentry but do NOT prevent the app from starting,
 * as the app should not depend on external services' uptime.
 */

import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import * as Sentry from '@sentry/node'

/**
 * Capture a warning message to Sentry
 */
function captureWarning(message: string, context?: Record<string, unknown>): void {
  logger.warn(message)
  Sentry.captureMessage(message, {
    level: 'warning',
    extra: context,
  })
}

/**
 * Validate Matomo API connectivity and authentication
 * Tests that the configured token can successfully authenticate with the Matomo instance
 */
async function validateMatomo(): Promise<void> {
  const matomoUrl = env.get('MATOMO_URL')
  const matomoToken = env.get('MATOMO_TOKEN')
  const matomoSiteId = env.get('MATOMO_SITE_ID')

  if (!matomoUrl || !matomoToken || !matomoSiteId) {
    logger.warn('Matomo: Configuration incomplete (MATOMO_URL, MATOMO_TOKEN, or MATOMO_SITE_ID missing)')
    return
  }

  try {
    // Test API authentication by requesting Matomo version
    const response = await fetch(`${matomoUrl}/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        module: 'API',
        method: 'API.getMatomoVersion',
        format: 'JSON',
        token_auth: matomoToken,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json() as { result?: string, message?: string, value?: string }

    // Check for Matomo error response
    if (data.result === 'error') {
      throw new Error(`Matomo API error: ${data.message}`)
    }

    // Successful response contains { value: "x.y.z" }
    if (data.value) {
      logger.info(`Matomo API: OK (v${data.value} at ${matomoUrl})`)
    }
    else {
      throw new Error('Unexpected Matomo response format')
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    captureWarning(`Matomo API validation failed: ${message}`, {
      matomoUrl,
      matomoSiteId,
      error: message,
    })
    logger.error(`Check MATOMO_URL (${matomoUrl}) and MATOMO_TOKEN configuration`)
    // Do NOT throw - app should start even if Matomo is misconfigured
  }
}

/**
 * Validate OpenFisca API connectivity
 * Tests that the OpenFisca service is reachable and responding
 */
async function validateOpenFisca(): Promise<void> {
  const openfiscaUrl = env.get('OPENFISCA_URL')

  if (!openfiscaUrl) {
    logger.warn('OpenFisca: URL not configured')
    return
  }

  try {
    // OpenFisca URL is typically /calculate, we need to check the base service
    // Extract base URL (remove /calculate if present)
    const baseUrl = openfiscaUrl.replace(/\/calculate\/?$/, '')

    const response = await fetch(`${baseUrl}/spec`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    logger.info(`OpenFisca API: OK (${baseUrl})`)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // OpenFisca is critical but may take time to start in Docker
    // Log warning and report to Sentry instead of failing hard
    captureWarning(`OpenFisca API not ready: ${message}`, {
      openfiscaUrl,
      error: message,
    })
    logger.warn('OpenFisca may still be starting up. The app will continue but calculations may fail.')
  }
}

/**
 * Validate all external services
 * Call this during application boot in production/staging
 */
export async function validateExternalServices(): Promise<void> {
  const appEnv = env.get('APP_ENV')

  // Only validate external services in production/staging
  // In development/test, services may not be available
  if (appEnv !== 'production' && appEnv !== 'staging') {
    logger.info(`External services validation: Skipped (${appEnv} mode)`)
    return
  }

  logger.info('Validating external services...')

  // Matomo validation - warns on failure but doesn't block startup
  await validateMatomo()

  // OpenFisca validation - warns on failure (may still be starting)
  await validateOpenFisca()

  logger.info('External services validation: OK')
}
