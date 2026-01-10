import type { Config } from '@japa/runner/types'
import { authApiClient } from '@adonisjs/auth/plugins/api_client'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { inertiaApiClient } from '@adonisjs/inertia/plugins/api_client'
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'
import { shieldApiClient } from '@adonisjs/shield/plugins/api_client'
import { apiClient } from '@japa/api-client'
import { assert } from '@japa/assert'
import { browserClient } from '@japa/browser-client'
import { expect } from '@japa/expect'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import { ensureTestDatabaseExists } from './utils/db_setup.js'
/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [
  assert(),
  expect(),
  pluginAdonisJS(app),
  apiClient({
    baseURL: 'http://localhost:3333',
  }),
  browserClient({
    runInSuites: ['e2e'],
  }),
  sessionApiClient(app),
  shieldApiClient(),
  authApiClient(app),
  inertiaApiClient(app),
]

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executed after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    async () => {
      await ensureTestDatabaseExists()
      await testUtils.db().migrate()
    },
  ],
  teardown: [],
}

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (suite.name === 'unit') {
    return [
      suite.setup(() => testUtils.httpServer().start()),
      suite.setup(() => testUtils.db().truncate()),
    ]
  }
  if (suite.name === 'e2e') {
    return [
      suite.setup(() => testUtils.httpServer().start()),
      suite.setup(() => testUtils.db().truncate()),
      suite.setup(() => testUtils.db().seed()),
    ]
  }
}
