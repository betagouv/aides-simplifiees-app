/**
 * Environment validation at startup
 *
 * This file logs informational messages about environment configuration.
 * Mandatory env vars are validated by the schema in env.ts
 */

import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

/**
 * Run all environment validations
 * Call this during application boot
 */
export function validateEnvironment() {
  const appEnv = env.get('APP_ENV')
  logger.info(`Environment validated. Running in ${appEnv.toUpperCase()} mode.`)

  if (appEnv !== 'production') {
    logger.info(`Matomo tracking is disabled (${appEnv} mode).`)
  }
}
