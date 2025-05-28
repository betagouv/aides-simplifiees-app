/**
 * Configuration for the iframe integration script
 * This file serves as a single source of truth for the iframe script version and integrity hashes
 */

export const IFRAME_SCRIPT_LATEST_VERSION = '1.0.1'

export const IFRAME_SCRIPT_INTEGRITY_LIST = [
  {
    'version': '1.0.1',
    'integrity': 'sha384-pWsCxETqtG8zVICx8IOmSGr/KVRL55v3OGmLHPe6M9SaaJTwHgBqkLyqL3JF0lg2'
  }
]

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
    throw new Error(`No integrity hash found for latest version ${IFRAME_SCRIPT_LATEST_VERSION}`)
  }
  return latestEntry.integrity
}