/**
 * Configuration Axe pour les tests d'accessibilité
 * Désactive certaines règles pour éviter les faux positifs
 * et configure les niveaux de conformité RGAA
 */

import type { AxeBuilder } from '@axe-core/playwright'
import type { Page } from 'playwright'
import { accessibilityLogger } from './test_logger.js'

export const axeConfig = {
  // Configuration par défaut pour tous les tests
  rules: {
    // Désactiver les règles problématiques avec des composants tiers
    'color-contrast': { enabled: true }, // Gardé activé pour RGAA 3.2
    'landmark-one-main': { enabled: true }, // RGAA 12.6
    'page-has-heading-one': { enabled: true }, // RGAA 9.1
    'region': { enabled: true }, // RGAA 12.6

    // Désactiver temporairement certaines règles pour composants tiers
    'nested-interactive': { enabled: false }, // Peut causer des faux positifs avec DSFR
    'scrollable-region-focusable': { enabled: false }, // Problématique avec certains sliders
  },

  // Tags de conformité WCAG/RGAA à vérifier
  tags: [
    'wcag2a',
    'wcag2aa',
    'wcag21aa',
    'best-practice',
  ],

  // Éléments à exclure globalement
  exclude: [
    // Scripts de tracking et analytics
    '[data-testid="matomo-opt-out"]',
    '.crisp-client',
    // Composants iframe tiers
    'iframe[src*="crisp"]',
    'iframe[src*="matomo"]',
  ],
}

/**
 * Configure Axe avec nos paramètres par défaut
 */
export async function configureAxe(page: Page): Promise<AxeBuilder> {
  const { AxeBuilder } = await import('@axe-core/playwright')

  return new AxeBuilder({ page })
    .withTags(axeConfig.tags)
    .exclude(axeConfig.exclude)
    .disableRules(['nested-interactive', 'scrollable-region-focusable'])
}

/**
 * Configuration spécifique pour les formulaires de simulation
 */
export const simulationFormAxeConfig = {
  ...axeConfig,
  // Règles spécifiques aux formulaires
  rules: {
    ...axeConfig.rules,
    'label': { enabled: true }, // RGAA 11.1 - Labels obligatoires
    'aria-required-attr': { enabled: true }, // RGAA 8.9
    'aria-valid-attr-value': { enabled: true }, // RGAA 8.8
    'form-field-multiple-labels': { enabled: true }, // RGAA 11.2
  },
}

/**
 * Configuration pour les pages d'administration
 */
export const adminAxeConfig = {
  ...axeConfig,
  // Règles spécifiques à l'admin (plus strictes)
  rules: {
    ...axeConfig.rules,
    'bypass': { enabled: true }, // RGAA 12.7 - Liens d'évitement
    'focus-order-semantics': { enabled: true }, // RGAA 10.3
  },
}

// Shared run ID for the current test session
let currentRunId: string | null = null

function getRunId(): string {
  if (!currentRunId) {
    const runTimestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0]
    currentRunId = `run_${runTimestamp}`
  }
  return currentRunId
}

/**
 * Exporte les résultats d'accessibilité vers un fichier JSON
 */
export async function exportAxeResults(results: any, testName: string): Promise<void> {
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const process = await import('node:process')

  // Use shared run directory for all tests in this session
  const runDir = path.join(process.cwd(), 'reports', 'accessibility', getRunId())

  // Simple filename without timestamp
  const filename = `${testName}.json`

  // Create the run directory if it doesn't exist
  await fs.mkdir(runDir, { recursive: true })

  const filePath = path.join(runDir, filename)

  await fs.writeFile(filePath, JSON.stringify(results, null, 2))
  accessibilityLogger.report(path.relative(process.cwd(), filePath))
}
