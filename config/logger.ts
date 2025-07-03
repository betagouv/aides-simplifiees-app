import env from '#start/env'
import { defineConfig, targets } from '@adonisjs/core/logger'
import app from '@adonisjs/core/services/app'

const enableLoggers = env.get('NODE_ENV') !== 'test'

const loggerConfig = defineConfig({
  default: 'app',

  /**
   * The loggers object can be used to define multiple loggers.
   * By default, we configure only one logger (named "app").
   */
  loggers: {
    app: {
      enabled: enableLoggers,
      name: env.get('APP_NAME'),
      level: env.get('LOG_LEVEL', 'info'),
      transport: {
        targets: targets()
          .pushIf(!app.inProduction, targets.pretty({
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          }))
          .pushIf(app.inProduction, targets.file({
            destination: 1,
          }))
          .toArray(),
      },
      // Redact sensitive information from logs
      redact: {
        paths: [
          'password',
          '*.password',
          'token',
          '*.token',
          'authorization',
          '*.authorization',
          'cookie',
          '*.cookie',
          'secret',
          '*.secret',
          'key',
          '*.key',
          'apiKey',
          '*.apiKey',
          'access_token',
          '*.access_token',
          'refresh_token',
          '*.refresh_token',
          'ssn',
          '*.ssn',
          'email',
          '*.email',
          'phone',
          '*.phone',
          'credit_card',
          '*.credit_card',
          'bank_account',
          '*.bank_account',
        ],
        censor: '[REDACTED]',
      },
    },
    // Dedicated logger for API requests
    api: {
      enabled: enableLoggers,
      name: 'api',
      level: env.get('LOG_LEVEL', 'info'),
      transport: {
        targets: targets()
          .pushIf(!app.inProduction, targets.pretty({
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          }))
          .pushIf(app.inProduction, targets.file({
            destination: 1,
          }))
          .toArray(),
      },
      redact: {
        paths: [
          'password',
          '*.password',
          'token',
          '*.token',
          'authorization',
          '*.authorization',
          'cookie',
          '*.cookie',
          'secret',
          '*.secret',
          'key',
          '*.key',
          'apiKey',
          '*.apiKey',
          'access_token',
          '*.access_token',
          'refresh_token',
          '*.refresh_token',
        ],
        censor: '[REDACTED]',
      },
    },
    // Dedicated logger for security events
    security: {
      enabled: enableLoggers,
      name: 'security',
      level: 'info',
      transport: {
        targets: targets()
          .pushIf(!app.inProduction, targets.pretty({
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          }))
          .pushIf(app.inProduction, targets.file({
            destination: 1,
          }))
          .toArray(),
      },
      redact: {
        paths: [
          'password',
          '*.password',
          'token',
          '*.token',
          'authorization',
          '*.authorization',
          'cookie',
          '*.cookie',
          'secret',
          '*.secret',
        ],
        censor: '[REDACTED]',
      },
    },
    // Dedicated logger for performance metrics
    performance: {
      enabled: enableLoggers,
      name: 'performance',
      level: 'info',
      transport: {
        targets: targets()
          .pushIf(!app.inProduction, targets.pretty({
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          }))
          .pushIf(app.inProduction, targets.file({
            destination: 1,
          }))
          .toArray(),
      },
    },
  },
})

export default loggerConfig

/**
 * Inferring types for the list of loggers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
