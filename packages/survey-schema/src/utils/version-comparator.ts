/**
 * Version comparison utility
 * Compares semantic version strings
 */

/**
 * Compare two semantic version strings
 *
 * @param version1 - First version string (e.g., "1.2.3")
 * @param version2 - Second version string (e.g., "1.2.4")
 * @returns -1 if version1 < version2, 0 if equal, 1 if version1 > version2
 *
 * @example
 * ```typescript
 * compareVersions('1.0.0', '1.0.1') // -1
 * compareVersions('2.0.0', '1.9.9') // 1
 * compareVersions('1.2.3', '1.2.3') // 0
 * ```
 */
export function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number)
  const v2Parts = version2.split('.').map(Number)

  const maxLength = Math.max(v1Parts.length, v2Parts.length)

  for (let i = 0; i < maxLength; i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0

    if (v1Part > v2Part)
      return 1
    if (v1Part < v2Part)
      return -1
  }

  return 0
}

/**
 * Check if version1 is greater than version2
 */
export function isVersionGreater(version1: string, version2: string): boolean {
  return compareVersions(version1, version2) > 0
}

/**
 * Check if version1 is less than version2
 */
export function isVersionLess(version1: string, version2: string): boolean {
  return compareVersions(version1, version2) < 0
}

/**
 * Check if versions are equal
 */
export function isVersionEqual(version1: string, version2: string): boolean {
  return compareVersions(version1, version2) === 0
}

/**
 * Check if version1 is greater than or equal to version2
 */
export function isVersionGreaterOrEqual(version1: string, version2: string): boolean {
  return compareVersions(version1, version2) >= 0
}

/**
 * Check if version1 is less than or equal to version2
 */
export function isVersionLessOrEqual(version1: string, version2: string): boolean {
  return compareVersions(version1, version2) <= 0
}

/**
 * Validate if a string is a valid semantic version
 */
export function isValidVersion(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+(-[a-z0-9.-]+)?(\+[a-z0-9.-]+)?$/i
  return semverRegex.test(version)
}

/**
 * Parse a semantic version string into its components
 */
export function parseVersion(version: string): {
  major: number
  minor: number
  patch: number
  prerelease?: string
  build?: string
} | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-z0-9.-]+))?(?:\+([a-z0-9.-]+))?$/i)

  if (!match) {
    return null
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
    prerelease: match[4],
    build: match[5],
  }
}
