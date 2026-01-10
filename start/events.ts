/**
 * Application events
 *
 * This file registers event listeners that run during the application lifecycle.
 */

import process from 'node:process'
import { validateDatabase } from '#start/db_validation'
import emitter from '@adonisjs/core/services/emitter'
import logger from '@adonisjs/core/services/logger'
import { validateEnvironment } from './env_validation.js'

/**
 * Run validations when HTTP server starts
 */
emitter.on('http:server_ready', async () => {
  try {
    // Validate environment variables first
    validateEnvironment()

    // Then validate database connectivity and schema
    await validateDatabase()

    logger.info('Application validations completed successfully')
  }
  catch (error) {
    logger.error('Application validation failed')
    logger.error(error.message)
    process.exit(1)
  }
})
