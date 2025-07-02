#!/usr/bin/env node

/**
 * Script de génération de rapport d'accessibilité pour les PRs GitHub
 * Analyse les rapports JSON générés par Axe et crée un commentaire formaté
 */

const fs = require('node:fs')
const path = require('node:path')
const process = require('node:process')

/**
 * Trouve le répertoire de run le plus récent
 * @param {string} baseDir - Répertoire de base contenant les runs
 * @returns {string|null} Chemin vers le répertoire de run le plus récent
 */
function findLatestRunDirectory(baseDir) {
  if (!fs.existsSync(baseDir)) {
    return null
  }

  const entries = fs.readdirSync(baseDir, { withFileTypes: true })
  const runDirs = entries
    .filter(entry => entry.isDirectory() && entry.name.startsWith('run_'))
    .map(entry => ({
      name: entry.name,
      path: path.join(baseDir, entry.name),
      stat: fs.statSync(path.join(baseDir, entry.name)),
    }))
    .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime())

  return runDirs.length > 0 ? runDirs[0].path : null
}

/**
 * Génère un résumé des violations d'accessibilité
 * @param {string} reportsDir - Répertoire contenant les rapports JSON
 * @returns {object} Objet contenant le résumé et les statistiques
 */
function generateAccessibilityReport(reportsDir = 'reports/accessibility') {
  if (!fs.existsSync(reportsDir)) {
    console.log('Aucun rapport d\'accessibilité généré')
    return null
  }

  // Find the latest run directory
  const latestRunDir = findLatestRunDirectory(reportsDir)

  if (!latestRunDir) {
    console.log('Aucun répertoire de run trouvé dans', reportsDir)
    return null
  }

  const reportFiles = fs.readdirSync(latestRunDir).filter(f => f.endsWith('.json'))

  if (reportFiles.length === 0) {
    console.log('Aucun fichier de rapport trouvé dans', latestRunDir)
    return null
  }

  console.log(`Analyse des rapports dans: ${path.relative(process.cwd(), latestRunDir)}`)

  let totalViolations = 0
  let criticalViolations = 0
  let seriousViolations = 0
  let reportSummary = '## Rapport d\'accessibilité\n\n'

  const testResults = []

  for (const file of reportFiles) {
    try {
      const filePath = path.join(latestRunDir, file)
      const report = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      const violations = report.violations || []

      const critical = violations.filter(v => v.impact === 'critical').length
      const serious = violations.filter(v => v.impact === 'serious').length
      const moderate = violations.filter(v => v.impact === 'moderate').length
      const minor = violations.filter(v => v.impact === 'minor').length

      totalViolations += violations.length
      criticalViolations += critical
      seriousViolations += serious

      const testName = file.replace('.json', '').replace(/_/g, ' ')

      testResults.push({
        name: testName,
        file,
        violations: violations.length,
        critical,
        serious,
        moderate,
        minor,
        details: violations,
      })

      // Ajout au résumé
      reportSummary += `### ${testName}\n`
      if (critical > 0)
        reportSummary += `- **CRITIQUES**: ${critical}\n`
      if (serious > 0)
        reportSummary += `- **IMPORTANTES**: ${serious}\n`
      if (moderate > 0)
        reportSummary += `- **MODÉRÉES**: ${moderate}\n`
      if (minor > 0)
        reportSummary += `- **MINEURES**: ${minor}\n`
      reportSummary += `- **TOTAL**: ${violations.length}\n\n`

      // Détail des violations critiques
      if (critical > 0) {
        reportSummary += '**VIOLATIONS CRITIQUES à corriger :**\n'
        violations
          .filter(v => v.impact === 'critical')
          .forEach((v) => {
            reportSummary += `- **${v.id}**: ${v.description}\n`
            reportSummary += `  - [Documentation](${v.helpUrl})\n`
          })
        reportSummary += '\n'
      }

      // Détail des violations importantes
      if (serious > 0 && critical === 0) { // N'afficher que si pas de critiques
        reportSummary += '**VIOLATIONS IMPORTANTES à examiner :**\n'
        violations
          .filter(v => v.impact === 'serious')
          .slice(0, 3) // Limiter à 3 pour éviter un commentaire trop long
          .forEach((v) => {
            reportSummary += `- **${v.id}**: ${v.description}\n`
          })
        if (serious > 3) {
          reportSummary += `- *... et ${serious - 3} autres violations importantes*\n`
        }
        reportSummary += '\n'
      }

      // Détail des violations modérées et mineures
      if (moderate > 0 || minor > 0) {
        reportSummary += '**VIOLATIONS MODÉRÉES ET MINEURES :**\n'
        if (moderate > 0) {
          reportSummary += `- **MODÉRÉES**: ${moderate}\n`
          violations
            .filter(v => v.impact === 'moderate')
            .forEach((v) => {
              reportSummary += `  - **${v.id}**: ${v.description}\n`
            })
        }
        if (minor > 0) {
          reportSummary += `- **MINEURES**: ${minor}\n`
          violations
            .filter(v => v.impact === 'minor')
            .forEach((v) => {
              reportSummary += `  - **${v.id}**: ${v.description}\n`
            })
        }
        reportSummary += '\n'
      }
    }
    catch (e) {
      console.error(`Erreur lors de la lecture de ${file}:`, e)
      reportSummary += `### ERREUR DE LECTURE : ${file}\n`
      reportSummary += `Impossible de parser le fichier de rapport.\n\n`
    }
  }

  // Résumé global
  reportSummary += '---\n\n'

  if (criticalViolations > 0) {
    reportSummary += `## ERREUR: ${criticalViolations} violation${criticalViolations > 1 ? 's' : ''} critique${criticalViolations > 1 ? 's' : ''} détectée${criticalViolations > 1 ? 's' : ''}\n\n`
    reportSummary += 'Les violations critiques doivent être corrigées avant le merge.\n\n'
  }
  else if (seriousViolations > 0) {
    reportSummary += `## ATTENTION: ${seriousViolations} violation${seriousViolations > 1 ? 's' : ''} importante${seriousViolations > 1 ? 's' : ''} détectée${seriousViolations > 1 ? 's' : ''}\n\n`
    reportSummary += 'Violations importantes à examiner, mais pas bloquantes pour le merge.\n\n'
  }
  else {
    reportSummary += '## SUCCÈS: Aucune violation critique ou importante détectée\n\n'
    reportSummary += 'Excellent travail ! L\'accessibilité est respectée sur les parcours testés.\n\n'
  }

  reportSummary += `**Résumé global**: ${totalViolations} violation${totalViolations > 1 ? 's' : ''} sur ${reportFiles.length} test${reportFiles.length > 1 ? 's' : ''}\n\n`

  // Liens utiles
  reportSummary += '### Ressources\n'
  reportSummary += '- [RGAA 4.1 - Guide d\'accessibilité](https://accessibilite.numerique.gouv.fr/)\n'
  reportSummary += '- [Axe DevTools](https://www.deque.com/axe/devtools/) pour tester manuellement\n'
  reportSummary += '- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) pour les contrastes\n'

  return {
    summary: reportSummary,
    stats: {
      total: totalViolations,
      critical: criticalViolations,
      serious: seriousViolations,
      testsCount: reportFiles.length,
    },
    results: testResults,
  }
}

/**
 * Fonction principale - peut être utilisée en ligne de commande ou importée
 */
function main() {
  const reportsDir = process.argv[2] || 'reports/accessibility'
  const outputFormat = process.argv[3] || 'markdown'

  const result = generateAccessibilityReport(reportsDir)

  if (!result) {
    process.exit(0)
  }

  if (outputFormat === 'json') {
    console.log(JSON.stringify(result, null, 2))
  }
  else {
    console.log(result.summary)
  }

  // Code de sortie selon les violations critiques
  if (result.stats.critical > 0) {
    process.exit(1)
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main()
}

module.exports = { generateAccessibilityReport }
