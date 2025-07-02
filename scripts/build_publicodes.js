#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { BuildLogger } from './build_logger.js'

const logger = new BuildLogger('PUBLICODES')

const publicodesPackages = [
  'aom-bordeaux',
  'aom-rennes',
  'entreprise-innovation',
]

function buildPackage(packageName) {
  const packagePath = path.join('publicodes', packageName)

  if (!existsSync(packagePath)) {
    logger.error(`Package ${packageName} not found at ${packagePath}`)
    process.exit(1)
  }

  logger.step(`Building ${packageName}...`)

  try {
    // Install dependencies
    const installOutput = execSync('pnpm install', {
      cwd: packagePath,
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: 120000, // 2 minutes timeout
    })

    logger.outputBlock(installOutput)

    // Compile
    const compileOutput = execSync('pnpm run compile', {
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
