#!/usr/bin/env node

/**
 * Script to detect Remix Icons (ri-icons) used in the inertia folder
 * This script scans Vue, TypeScript, and JavaScript files for references to Remix icons
 * and generates a report of unique icons used.
 *
 * Usage: node scripts/detect_icons.js
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
    else if (FILE_EXTENSIONS.includes(path.extname(entry.name))) {
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
 * Generate a markdown report of icon usage
 */
function generateMarkdownReport(sortedIcons, iconUsage) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportPath = path.join(process.cwd(), `icon-usage-report-${timestamp}.md`)

  let markdown = `# Remix Icons Usage Report\n\n`
  markdown += `Generated on: ${new Date().toLocaleString()}\n\n`
  markdown += `Found ${sortedIcons.length} unique Remix icons.\n\n`

  // Summary table
  markdown += `## Icons Summary\n\n`
  markdown += `| Icon Name | Usage Count |\n`
  markdown += `|-----------|------------:|\n`

  for (const icon of sortedIcons) {
    const usageCount = iconUsage.get(icon).length
    markdown += `| \`${icon}\` | ${usageCount} |\n`
  }

  // Code snippets for including in project
  markdown += `\n## Integration Code\n\n`

  // For scripts/build_icons_collections.js
  markdown += `### For scripts/build_icons_collections.js\n\n`
  markdown += '```javascript\n'
  markdown += `const riIconNames = [\n`
  markdown += `  '${sortedIcons.join('\',\n  \'')}',\n`
  markdown += `];\n`
  markdown += '```\n'

  fs.writeFileSync(reportPath, markdown)
  return reportPath
}

/**
 * Main function to scan directory and report icons
 */
async function detectIcons() {
  try {
    console.log(`Scanning ${INERTIA_DIR} for Remix icons...`)

    // Get all files to scan
    const files = await scanDirectory(INERTIA_DIR)
    console.log(`Found ${files.length} files to scan.`)

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

    // Generate report
    console.log(`\nFound ${sortedIcons.length} unique Remix icons:\n`)

    // Detailed report
    console.log('Detailed Usage:')
    console.log('==============')
    for (const icon of sortedIcons) {
      const usage = iconUsage.get(icon)
      console.log(`- ${icon} (used in ${usage.length} file${usage.length !== 1 ? 's' : ''})`)
      // Uncomment the following line to see which files use each icon
      // console.log(`  Files: ${usage.join(', ')}`);
    }

    // Format for scripts/build_icons_collections.js
    console.log(`\nList for scripts/build_icons_collections.js:`)
    console.log('=======================')
    console.log(`const riIconNames = [`)
    console.log(`  '${sortedIcons.join('\',\n  \'')}',`)
    console.log(`];`)

    // Generate markdown report
    const reportPath = generateMarkdownReport(sortedIcons, iconUsage)
    console.log(`\nDetailed report saved to: ${reportPath}`)
  }
  catch (error) {
    console.error('Error scanning files:', error)
    process.exit(1)
  }
}

// Run the script
detectIcons()
