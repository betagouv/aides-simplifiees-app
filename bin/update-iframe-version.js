#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

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
      // Simple parsing - replace single quotes with double quotes for JSON parsing
      const listStr = integrityListMatch[1].replace(/'/g, '"')
      existingList = JSON.parse(listStr)
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (error) {
      console.warn('Could not parse existing integrity list, starting fresh')
      existingList = []
    }
  }

  return {
    latestVersion: latestVersionMatch[1],
    existingList,
  }
}

/**
 * Update the iframe script version
 */
function updateIframeVersion(newVersion) {
  if (!newVersion) {
    console.error('Usage: node bin/update-iframe-version.js <new-version>')
    process.exit(1)
  }

  // Validate version format (basic semver check)
  if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error('Version must be in semver format (e.g., 1.0.2)')
    process.exit(1)
  }

  const { existingList } = getIframeConfig()

  // Check if version already exists
  const existingEntry = existingList.find(item => item.version === newVersion)
  if (existingEntry) {
    console.error(`Version ${newVersion} already exists in the integrity list`)
    process.exit(1)
  }

  console.log(`Updating iframe script version to ${newVersion}...`)

  // Update the config file with new version (keeping existing integrity list)
  const configContent = `/**
 * Configuration for the iframe integration script
 * This file serves as a single source of truth for the iframe script version and integrity hashes
 */

export const IFRAME_SCRIPT_LATEST_VERSION = '${newVersion}'

export const IFRAME_SCRIPT_INTEGRITY_LIST = ${JSON.stringify(existingList, null, 2).replace(/"/g, '\'')}

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
  console.log(`Updated IFRAME_SCRIPT_LATEST_VERSION to ${newVersion} in config/iframe_integration.ts`)

  return newVersion
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const newVersion = process.argv[2]
  updateIframeVersion(newVersion)
}

export { updateIframeVersion }
