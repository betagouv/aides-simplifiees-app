#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { BuildLogger } from './build_logger.js'

const logger = new BuildLogger('PUBLICODES')

const publicodesPackages = [
  'publicodes-aom-bordeaux',
  'publicodes-aom-rennes',
  'publicodes-entreprise-innovation',
  'apl',
  // 'entreprise-innovation',
]

// TODO: Remove this build script once packages are published to npm
// and consumed as dependencies instead of local packages

/**
 * Detect which package manager is available and being used
 * Priority: npm > pnpm > yarn (npm first for remote server compatibility)
 */
function detectPackageManager() {
  try {
    // Check for npm (most common, especially on remote servers)
    execSync('npm --version', { stdio: 'pipe' })
    return 'npm'
  }
  catch {
    // npm not available
  }

  try {
    execSync('pnpm --version', { stdio: 'pipe' })
    return 'pnpm'
  }
  catch {
    // pnpm not available
  }

  try {
    execSync('yarn --version', { stdio: 'pipe' })
    return 'yarn'
  }
  catch {
    // yarn not available
  }

  logger.error('No package manager found (npm, pnpm, or yarn)')
  process.exit(1)
}

const packageManager = detectPackageManager()
logger.info(`Using package manager: ${packageManager}`)

function buildPackage(packageName) {
  const packagePath = path.join('packages', packageName)

  if (!existsSync(packagePath)) {
    logger.error(`Package ${packageName} not found at ${packagePath}`)
    process.exit(1)
  }

  logger.step(`Building ${packageName}...`)

  try {
    // Install dependencies
    const installOutput = execSync(`${packageManager} install`, {
      cwd: packagePath,
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 120000, // 2 minutes timeout
    })

    logger.outputBlock(installOutput)

    // Compile
    const compileOutput = execSync(`${packageManager} run compile`, {
      cwd: packagePath,
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 180000, // 3 minutes timeout
    })

    logger.outputBlock(compileOutput)

    logger.success(`${packageName} built successfully`)
  }
  catch (error) {
    logger.error(`Failed to build ${packageName}: ${error.message}`)
    process.exit(1)
  }
}

logger.startProcess('publicodes packages build')

for (const packageName of publicodesPackages) {
  buildPackage(packageName)
}

logger.completeProcess('publicodes packages build')
