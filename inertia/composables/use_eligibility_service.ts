import Engine from 'publicodes'
import sourceRules from '#publicodes-build/index'

export interface DispositifDetail {
  id: string
  title: string
  description: string
}

export interface DispositifEligibilityInfo {
  id: string
  title: string
  description: string
  value: boolean | null | any
  status: 'eligible' | 'ineligible' | 'potential' | 'error'
  reason?: string
  missingInfo?: string[]
}

export interface EligibilityResults {
  eligibleDispositifs: DispositifEligibilityInfo[]
  potentialDispositifs: DispositifEligibilityInfo[]
  ineligibleDispositifs: DispositifEligibilityInfo[]
}

// Utility: convert kebab-case or snake_case to camelCase
function toCamelCase(str: string): string {
  return str.replace(/[-_](\w)/g, (_, c) => c ? c.toUpperCase() : '')
}

// Automatic mapping: map survey answers to publicodes variables by casting ids
function autoMapAnswersToPublicodesVariables(answers: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {}
  for (const [key, value] of Object.entries(answers)) {
    mapped[toCamelCase(key)] = value
  }
  return mapped
}

export function useEligibilityService() {
  function calculateEligibility(
    surveyId: string,
    answers: Record<string, any>,
    dispositifsToEvaluate: DispositifDetail[]
  ): EligibilityResults {
    const engine = new Engine(sourceRules)
    console.log('answers', answers)
    const mappedAnswers = autoMapAnswersToPublicodesVariables(answers)
    console.log('mappedAnswers', mappedAnswers)
    engine.setSituation(mappedAnswers)

    const results: EligibilityResults = {
      eligibleDispositifs: [],
      potentialDispositifs: [],
      ineligibleDispositifs: [],
    }

    for (const dispositif of dispositifsToEvaluate) {
      try {
        const evaluation = engine.evaluate(dispositif.id)
        const value = evaluation.nodeValue
        const baseResult = {
          id: dispositif.id,
          title: dispositif.title || dispositif.id,
          description: dispositif.description,
          value: value,
        }
        if (value === true) {
          results.eligibleDispositifs.push({
            ...baseResult,
            status: 'eligible',
          })
        } else if (value === false) {
          let reason = "Les conditions d'éligibilité ne sont pas remplies."
          try {
            const reasonEval = engine.evaluate(`${dispositif.id} . raison non éligible`)
            if (typeof reasonEval.nodeValue === 'string' && reasonEval.nodeValue.trim() !== '') {
              reason = reasonEval.nodeValue
            }
          } catch (e) { /* ignore */ }
          results.ineligibleDispositifs.push({
            ...baseResult,
            status: 'ineligible',
            reason,
          })
        } else {
          let reason = "Des informations supplémentaires sont nécessaires pour déterminer l'éligibilité."
          const missingVars = Object.keys(evaluation.missingVariables || {})
          if (missingVars.length > 0) {
            reason = `Informations manquantes : ${missingVars.join(', ')}.`
          }
          results.potentialDispositifs.push({
            ...baseResult,
            status: 'potential',
            reason,
            missingInfo: missingVars,
          })
        }
      } catch (error) {
        results.potentialDispositifs.push({
          id: dispositif.id,
          title: dispositif.title || dispositif.id,
          description: dispositif.description,
          value: null,
          status: 'error',
          reason: `Erreur lors de l'évaluation de la règle : ${(error as Error).message}`,
        })
      }
    }
    return results
  }

  return {
    calculateEligibility,
  }
}
