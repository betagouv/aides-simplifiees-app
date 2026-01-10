import dbConfig from '#config/database'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

export async function ensureTestDatabaseExists() {
  if (env.get('NODE_ENV') !== 'test') {
    return
  }

  const defaultConnection = dbConfig.connection
  const connectionConfig = dbConfig.connections[defaultConnection as keyof typeof dbConfig.connections]

  if (!connectionConfig) {
    logger.error(`No connection configuration found for "${defaultConnection}"`)
    return
  }

  // Handle PostgreSQL
  if (connectionConfig.client === 'pg') {
    await ensurePostgresDatabaseExists(connectionConfig)
  }
  // Add other drivers (mysql, sqlite, etc.) here as needed
}

async function ensurePostgresDatabaseExists(config: any) {
  const { default: pg } = await import('pg')

  const pgConnectionConfig = {
    host: config.connection.host,
    port: config.connection.port,
    user: config.connection.user,
    password: config.connection.password,
    database: 'postgres', // Connect to default database first
  }

  const targetDatabase = config.connection.database
  if (!targetDatabase) {
    throw new Error('Database name is not defined in configuration')
  }

  const client = new pg.Client(pgConnectionConfig)

  try {
    await client.connect()

    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDatabase],
    )

    if (result.rowCount === 0) {
      logger.info(`Creating test database "${targetDatabase}"...`)
      // CREATE DATABASE cannot run in a transaction block
      await client.query(`CREATE DATABASE "${targetDatabase}"`)
      logger.info(`Database "${targetDatabase}" created successfully.`)
    }
  }
  catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('password authentication failed')) {
        logger.error('Failed to authenticate with database to create test DB. Check credentials.')
      }
      else {
        logger.error({ err: error }, `Failed to ensure test database exists: ${error.message}`)
      }
    }
    throw error
  }
  finally {
    await client.end()
  }
}
