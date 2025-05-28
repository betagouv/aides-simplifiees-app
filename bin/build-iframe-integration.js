#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

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
  console.log('🚀 Starting iframe integration build process...\n')

  try {
    // Step 1: Get current version from config (no auto-increment)
    const targetVersion = getCurrentVersion()

    console.log(`📦 Target version: ${targetVersion}`)
    console.log('')

    // Step 2: Build with Vite
    console.log('🏗️  Building with Vite...')
    execSync('vite build --config vite.iframe-integration.config.ts', {
      stdio: 'inherit',
      cwd: projectRoot
    })
    console.log('')

    // Step 3: Generate SRI hash
    console.log('🔐 Generating SRI hash...')
    execSync(`node bin/generate-sri-hash.js ${targetVersion}`, {
      stdio: 'inherit',
      cwd: projectRoot
    })
    console.log('')

    console.log(`✅ Build completed successfully!`)
    console.log(`📁 Generated: public/assets/iframe-integration@${targetVersion}.js`)
    console.log(`🔐 SRI hash updated in config for version ${targetVersion}`)
    console.log('')
    console.log('🎯 Next steps:')
    console.log('   - Commit the changes to git')
    console.log('   - The version is ready for integration')

  } catch (error) {
    console.error('❌ Build failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildIframeIntegration()
}

export { buildIframeIntegration }
