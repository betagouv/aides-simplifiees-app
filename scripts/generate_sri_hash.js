#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { BuildLogger } from './build_logger.js'

const logger = new BuildLogger('SRI')

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

/**
 * Extract configuration from the TypeScript config file
 */
function getIframeConfig() {
  const configPath = resolve(projectRoot, 'config/iframe_integration.ts')
  const configContent = readFileSync(configPath, 'utf-8')

  const latestVersionMatch = configContent.match(/IFRAME_SCRIPT_LATEST_VERSION = '([^']+)'/)
  if (!latestVersionMatch) {
    throw new Error('Could not find IFRAME_SCRIPT_LATEST_VERSION in config file')
  }

  // Extract existing integrity list
  const integrityListMatch = configContent.match(/IFRAME_SCRIPT_INTEGRITY_LIST = (\[[\s\S]*?\])/)
  let existingList = []
  if (integrityListMatch) {
    try {
      // More robust parsing to handle TypeScript object syntax
      let listStr = integrityListMatch[1]

      // Replace single quotes with double quotes (for quoted keys/values)
      listStr = listStr.replace(/'/g, '"')

      // Quote unquoted object keys
      listStr = listStr.replace(/(\s*)(\w+)(\s*):/g, '$1"$2"$3:')

      // Remove trailing commas before closing braces/brackets (common in TypeScript)
      listStr = listStr.replace(/,(\s*[}\]])/g, '$1')

      existingList = JSON.parse(listStr)
    }
    catch (error) {
      logger.error('CRITICAL ERROR: Could not parse existing integrity list!')
      logger.error(`Parse error: ${error.message}`)
      logger.error('')
      logger.error('This is a critical security issue - the build cannot continue without')
      logger.error('being able to verify existing version hashes.')
      logger.error('')
      logger.error('The config file format may be corrupted. Please check:')
      logger.error('- config/iframe_integration.ts syntax')
      logger.error('- IFRAME_SCRIPT_INTEGRITY_LIST array format')
      logger.error('')
      logger.error('Extracted content that failed to parse:')
      logger.error(integrityListMatch[1])
      logger.error('')
      logger.error('Build aborted to prevent overwriting existing version hashes.')
      process.exit(1)
    }
  }

  return {
    latestVersion: latestVersionMatch[1],
    existingList,
  }
}

/**
 * Generate SRI hash for the iframe integration script
 */
function generateSriHash(version) {
  const scriptPath = resolve(projectRoot, `public/assets/iframe-integration@${version}.js`)

  try {
    // Read the file content
    const fileContent = readFileSync(scriptPath)

    // Generate SHA-384 hash
    const hash = createHash('sha384')
    hash.update(fileContent)
    const sriHash = `sha384-${hash.digest('base64')}`

    logger.info(`Generated SRI hash for iframe-integration@${version}.js:`)
    logger.info(sriHash)

    return sriHash
  }
  catch (error) {
    logger.error(`Error generating SRI hash for version ${version}: ${error}`)
    throw error
  }
}

/**
 * Update the config file with new integrity hash
 */
function updateConfigWithIntegrity(version, integrity, force = false) {
  const { latestVersion, existingList } = getIframeConfig()

  // Check if version already exists with a different hash
  const existingEntry = existingList.find(item => item.version === version)
  if (existingEntry && existingEntry.integrity !== integrity) {
    if (!force) {
      logger.error(`Error: Version ${version} already exists with a different integrity hash!`)
      logger.error(`   Existing hash: ${existingEntry.integrity}`)
      logger.error(`   New hash:      ${integrity}`)
      logger.error('')
      logger.error('This could indicate that:')
      logger.error('1. The script content has changed but you kept the same version')
      logger.error('2. You should increment the version number instead')
      logger.error('')
      logger.error('To fix this:')
      logger.error(`- Change IFRAME_SCRIPT_LATEST_VERSION to a new version (e.g., increment from ${version})`)
      logger.error('- Or revert your changes if they were unintentional')
      logger.error('- Or use --force flag if you really need to update this version (NOT RECOMMENDED)')
      process.exit(1)
    }
    else {
      logger.warning(`WARNING: Forcing update of existing version ${version} with new integrity hash!`)
      logger.warning(`   Old hash: ${existingEntry.integrity}`)
      logger.warning(`   New hash: ${integrity}`)
      logger.warning('   This may break existing integrations using this version!')
    }
  }

  // If same version with same hash, just update silently (rebuild case)
  if (existingEntry && existingEntry.integrity === integrity) {
    logger.success(`Version ${version} already exists with the same integrity hash - no changes needed`)
    return
  }

  // Remove existing entry for this version if it exists (shouldn't happen now, but kept for safety)
  const filteredList = existingList.filter(item => item.version !== version)

  // Add new entry
  const newList = [
    ...filteredList,
    {
      version,
      integrity,
    },
  ]

  // Sort by version (simple string sort should work for semver)
  newList.sort((a, b) => a.version.localeCompare(b.version))

  // Determine action
  const action = existingEntry ? (force ? 'Force updated' : 'Updated') : 'Added'

  // Generate the new config content
  const configContent = `/**
 * Configuration for the iframe integration script
 * This file serves as a single source of truth for the iframe script version and integrity hashes
 */

export const IFRAME_SCRIPT_LATEST_VERSION = '${latestVersion}'

export const IFRAME_SCRIPT_INTEGRITY_LIST = ${JSON.stringify(newList, null, 2).replace(/"/g, '\'')}

/**
 * Get integrity hash for a specific version
 */
export function getIntegrityForVersion(version: string): string | null {
  const entry = IFRAME_SCRIPT_INTEGRITY_LIST.find(item => item.version === version)
  return entry ? entry.integrity : null
}

/**
 * Get the latest integrity hash
 */
export function getLatestIntegrity(): string {
  const latestEntry = IFRAME_SCRIPT_INTEGRITY_LIST.find(item => item.version === IFRAME_SCRIPT_LATEST_VERSION)
  if (!latestEntry) {
    throw new Error(\`No integrity hash found for latest version \${IFRAME_SCRIPT_LATEST_VERSION}\`)
  }
  return latestEntry.integrity
}`

  const configPath = resolve(projectRoot, 'config/iframe_integration.ts')
  writeFileSync(configPath, configContent)
  logger.success(`${action} integrity hash in config/iframe_integration.ts for version ${version}`)
}

/**
 * Main function to generate and update SRI hash
 */
function main() {
  const args = process.argv.slice(2)
  const version = args.find(arg => !arg.startsWith('--'))
  const force = args.includes('--force')

  if (!version) {
    const { latestVersion } = getIframeConfig()
    logger.info(`No version specified, using latest version: ${latestVersion}`)
    const integrity = generateSriHash(latestVersion)
    updateConfigWithIntegrity(latestVersion, integrity, force)
  }
  else {
    const integrity = generateSriHash(version)
    updateConfigWithIntegrity(version, integrity, force)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { generateSriHash, updateConfigWithIntegrity }
