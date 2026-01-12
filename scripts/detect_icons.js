#!/usr/bin/env node

/**
 * Script to detect Remix Icons (ri-icons) used in the inertia folder
 * This script scans Vue, TypeScript, and JavaScript files for references to Remix icons
 * and generates a report of unique icons used.
 *
 * Usage: node scripts/detect_icons.js
 *
 * Options:
 *   --check    Compare detected icons against bundled icons and exit with error if missing
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)

const __dirname = path.dirname(new URL(import.meta.url).pathname)

// Path to the inertia folder
const INERTIA_DIR = path.resolve(__dirname, '../inertia')

// Regex patterns to find Remix icons
const ICON_PATTERNS = [
  // Pattern for string literals like 'ri:icon-name' or "ri:icon-name"
  /['"](ri:[a-z0-9-]+)['"]/g,

  // Pattern for icon name in TypeScript/JavaScript object like 'ri-icon-name': '...'
  /['"]ri-([a-z0-9-]+)['"]:/g,
]

// File extensions to scan
const FILE_EXTENSIONS = ['.vue', '.ts', '.js', '.tsx', '.jsx']

// Files to exclude from scanning (generated files)
const EXCLUDED_FILES = ['icon_collections.ts']

/**
 * Recursively scan a directory for files with specific extensions
 */
async function scanDirectory(dir) {
  const files = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await scanDirectory(fullPath)))
    }
    else if (FILE_EXTENSIONS.includes(path.extname(entry.name)) && !EXCLUDED_FILES.includes(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Extract Remix icon names from file content
 */
function extractIconsFromContent(content) {
  const icons = new Set()

  for (const pattern of ICON_PATTERNS) {
    const matches = content.matchAll(pattern)
    for (const match of matches) {
      // Get the captured group
      const capturedIcon = match[1]

      if (!capturedIcon) {
        continue
      }

      if (capturedIcon.startsWith('ri:')) {
        // For patterns like 'ri:icon-name', convert to 'icon-name'
        icons.add(capturedIcon.substring(3))
      }
      else if (capturedIcon.startsWith('ri-')) {
        // For patterns like 'ri-icon-name', keep 'icon-name'
        icons.add(capturedIcon)
      }
    }
  }

  return Array.from(icons)
}

/**
 * Get bundled icon names from icon_collections.ts
 */
async function getBundledIcons() {
  const collectionsPath = path.resolve(__dirname, '../inertia/icon_collections.ts')

  if (!fs.existsSync(collectionsPath)) {
    return new Set()
  }

  const content = await readFile(collectionsPath, 'utf8')

  // Extract icon names from the bundled collection
  // Look for pattern like 'icon-name': { body: in the icons object
  const iconNames = new Set()
  const iconNameRegex = /'([a-z0-9-]+)':\s*\{\s*body:/g
  const matches = content.matchAll(iconNameRegex)
  for (const match of matches) {
    iconNames.add(match[1])
  }

  return iconNames
}

/**
 * Main function to scan directory and report icons
 */
async function detectIcons(checkMode = false) {
  try {
    // Get all files to scan
    const files = await scanDirectory(INERTIA_DIR)

    // Array to store all icons found
    const allIcons = new Set()

    // Map to track which files use which icons
    const iconUsage = new Map()

    // Process each file
    for (const file of files) {
      const content = await readFile(file, 'utf8')
      const iconsInFile = extractIconsFromContent(content)

      if (iconsInFile.length > 0) {
        const relativePath = path.relative(process.cwd(), file)

        for (const icon of iconsInFile) {
          allIcons.add(icon)

          if (!iconUsage.has(icon)) {
            iconUsage.set(icon, [])
          }
          iconUsage.get(icon).push(relativePath)
        }
      }
    }

    // Sort icons alphabetically
    const sortedIcons = Array.from(allIcons).sort()

    // Check mode: compare against bundled icons
    if (checkMode) {
      const bundledIcons = await getBundledIcons()

      if (bundledIcons.size === 0) {
        console.error('Error: No bundled icons found. Run "pnpm build:icons" first.')
        process.exit(1)
      }

      const missingIcons = sortedIcons.filter(icon => !bundledIcons.has(icon))

      if (missingIcons.length > 0) {
        console.error('Missing icons detected:')
        for (const icon of missingIcons) {
          const usage = iconUsage.get(icon)
          console.error(`  - ri:${icon} (${usage.join(', ')})`)
        }
        console.error('\nRun "pnpm detect:icons && pnpm build:icons" to fix this.')
        process.exit(1)
      }

      console.log(`All ${sortedIcons.length} icons are properly bundled.`)
    }
    else {
      // Output icons list for build_icons_collections.js
      console.log(`Found ${sortedIcons.length} icons:`)
      console.log(`const riIconNames = [`)
      console.log(`  '${sortedIcons.join('\',\n  \'')}',`)
      console.log(`]`)
    }
  }
  catch (error) {
    console.error('Error scanning files:', error)
    process.exit(1)
  }
}

// Run the script
const args = process.argv.slice(2)
const checkMode = args.includes('--check')

detectIcons(checkMode)
