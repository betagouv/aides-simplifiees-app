#!/usr/bin/env node

/**
 * Wrapper script for vue-dsfr-icons CLI with clean logging
 */

import { execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import process from 'node:process'
import { BuildLogger } from './build_logger.js'

const require = createRequire(import.meta.url)
const logger = new BuildLogger('icons')

const SOURCE = 'scripts/build_icons_collections.js'
const TARGET = 'inertia/icon_collections.ts'

try {
  // Load icon count from registry
  const icons = require('./detected_icons.json')
  const iconCount = icons.length

  logger.info(`Building ${iconCount} icons from registry...`)

  // Run vue-dsfr-icons CLI (suppress its output)
  execSync(`npx vue-dsfr-icons -s ${SOURCE} -t ${TARGET}`, {
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  logger.success(`Generated ${TARGET} with ${iconCount} icons`)
}
catch (error) {
  logger.error(`Build failed: ${error.message}`)
  process.exit(1)
}
