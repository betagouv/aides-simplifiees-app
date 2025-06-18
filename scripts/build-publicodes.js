#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const publicodesPackages = [
  // 'aom-bordeaux',
  // 'aom-rennes',
  'entreprise-innovation',
]

function buildPackage(packageName) {
  const packagePath = path.join('publicodes', packageName)

  if (!existsSync(packagePath)) {
    console.error(`❌ Package ${packageName} not found at ${packagePath}`)
    process.exit(1)
  }

  console.log(`📦 Building ${packageName}...`)

  try {
    // Install dependencies
    execSync('pnpm install', {
      cwd: packagePath,
      stdio: 'inherit',
      timeout: 120000, // 2 minutes timeout
    })

    // Compile
    execSync('pnpm run compile', {
      cwd: packagePath,
      stdio: 'inherit',
      timeout: 180000, // 3 minutes timeout
    })

    console.log(`✅ ${packageName} built successfully`)
  }
  catch (error) {
    console.error(`❌ Failed to build ${packageName}:`, error.message)
    process.exit(1)
  }
}

console.log('🚀 Building all publicodes packages...')

for (const packageName of publicodesPackages) {
  buildPackage(packageName)
}

console.log('🎉 All publicodes packages built successfully!')
