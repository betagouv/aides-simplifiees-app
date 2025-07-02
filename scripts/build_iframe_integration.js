#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { BuildLogger } from './build_logger.js'

const logger = new BuildLogger('IFRAME')

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

/**
 * Get the current latest version from config
 */
function getCurrentVersion() {
  const configPath = resolve(projectRoot, 'config/iframe_integration.ts')
  const configContent = readFileSync(configPath, 'utf-8')

  const latestVersionMatch = configContent.match(/IFRAME_SCRIPT_LATEST_VERSION = '([^']+)'/)
  if (!latestVersionMatch) {
    throw new Error('Could not find IFRAME_SCRIPT_LATEST_VERSION in config file')
  }

  return latestVersionMatch[1]
}

/**
 * Main build process
 */
function buildIframeIntegration() {
  logger.startProcess('iframe integration build')

  try {
    // Step 1: Get current version from config (no auto-increment)
    const targetVersion = getCurrentVersion()

    logger.info(`Target version: ${targetVersion}`)

    // Step 2: Build with Vite
    logger.step('Building with Vite...')
    const buildOutput = execSync('vite build --config vite.iframe-integration.config.ts', {
      stdio: 'pipe',
      encoding: 'utf-8',
      cwd: projectRoot,
    })

    logger.outputBlock(buildOutput)

    // Step 3: Generate SRI hash
    logger.step('Generating SRI hash...')
    const sriOutput = execSync(`node scripts/generate_sri_hash.js ${targetVersion}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
      cwd: projectRoot,
    })

    logger.outputBlock(sriOutput)

    logger.success(`Generated: public/assets/iframe-integration@${targetVersion}.js`)
    logger.success(`SRI hash updated in config for version ${targetVersion}`)
    logger.info('Next steps:')
    logger.info('  - Commit the changes to git')
    logger.info('  - The version is ready for integration')

    logger.completeProcess('iframe integration build')
  }
  catch (error) {
    logger.failProcess('iframe integration build', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildIframeIntegration()
}

export { buildIframeIntegration }
