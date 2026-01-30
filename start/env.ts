/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import process from 'node:process'
import { Env } from '@adonisjs/core/env'

// eslint-disable-next-line antfu/no-top-level-await
export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the application
  |----------------------------------------------------------
  */
  APP_NAME: Env.schema.string(),
  PUBLIC_APP_URL: Env.schema.string(),
  APP_ENV: Env.schema.enum(['development', 'test', 'staging', 'production'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for admin authentication
  |----------------------------------------------------------
  */
  ADMIN_LOGIN: Env.schema.string(),
  ADMIN_PASSWORD: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Matomo analytics
  |----------------------------------------------------------
  */
  MATOMO_URL: Env.schema.string(),
  MATOMO_TOKEN: Env.schema.string(),
  MATOMO_SITE_ID: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for external API services
  |----------------------------------------------------------
  */
  LEXIMPACT_URL: Env.schema.string(),
  OPENFISCA_URL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for monitoring and debugging
  |----------------------------------------------------------
  */
  MONITORING_SECRET: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for Sentry error tracking
  |----------------------------------------------------------
  */
  SENTRY_DSN: process.env.APP_ENV === 'production' || process.env.APP_ENV === 'staging'
    ? Env.schema.string()
    : Env.schema.string.optional(),
})
