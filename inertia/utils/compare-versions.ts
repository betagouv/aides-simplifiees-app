/**
 * Form version-related utilities
 */

/**
 * Compares two semantic version strings
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = i < parts1.length ? parts1[i] : 0
    const part2 = i < parts2.length ? parts2[i] : 0

    if (part1 > part2) {
      return 1
    }
    if (part1 < part2) {
      return -1
    }
  }

  return 0
}
