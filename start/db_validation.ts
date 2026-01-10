/**
 * Database validation at startup
 *
 * Validates database connectivity and schema integrity before the app starts serving requests.
 * This prevents the app from starting successfully but failing on first user request.
 */

import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

/**
 * Check if database exists and has been migrated
 * Call this during application boot
 */
export async function validateDatabase() {
  try {
    // Test basic database connectivity
    await db.rawQuery('SELECT 1')
    logger.info('Database connection: OK')

    // Check if migrations table exists (indicates migrations have been run)
    const result = await db.rawQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'adonis_schema'
      ) as table_exists
    `)

    const migrationsTableExists = result.rows?.[0]?.table_exists

    if (!migrationsTableExists) {
      logger.error('Database not initialized. Run: node ace migration:run --force && node ace db:seed')
      throw new Error('Database not initialized. Run migrations before starting the app.')
    }

    // Check if at least one migration has been run
    const migrationsResult = await db.rawQuery('SELECT COUNT(*) as count FROM adonis_schema')
    const migrationCount = Number.parseInt(migrationsResult.rows?.[0]?.count || '0')

    if (migrationCount === 0) {
      logger.error('No migrations found. Run: node ace migration:run --force && node ace db:seed')
      throw new Error('No migrations have been run. Run migrations before starting the app.')
    }

    logger.info(`Database schema: OK (${migrationCount} migrations applied)`)
  }
  catch (error) {
    // If error is about database not existing
    if (error.message?.includes('does not exist')) {
      logger.error(`Database connection failed: ${error.message}. Ensure database is running and migrations are applied.`)
      throw new Error('Database does not exist or connection failed.')
    }

    // Re-throw if it's our custom error
    if (
      error.message?.includes('Database not initialized')
      || error.message?.includes('No migrations have been run')
    ) {
      throw error
    }

    // For other database errors, log and re-throw
    logger.error(`Database validation failed: ${error.message}`)
    throw error
  }
}
