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

    const mappedAnswers = autoMapAnswersToPublicodesVariables(answers)


    //1. Filter out keys that don't exist in the publicodes model
    const validMappedAnswers: Record<string, any> = {}
    const missingKeys: string[] = []

    Object.keys(mappedAnswers).forEach(key => {
      try {
        // Use type assertion to handle dynamic rule names
        engine.getRule(key as any)
        validMappedAnswers[key] = mappedAnswers[key]
      } catch (e) {
        missingKeys.push(key)
      }
    })

    if (missingKeys.length > 0) {
      console.log('Missing keys in publicodes model:', missingKeys)
    }


    //2. Transform boolean values to 'oui' or 'non' and wrap string values with quotes
    Object.keys(validMappedAnswers).forEach(key => {
      if (validMappedAnswers[key] === true) {
        validMappedAnswers[key] = 'oui'
      } else if (validMappedAnswers[key] === false) {
        validMappedAnswers[key] = 'non'
      } else if (typeof validMappedAnswers[key] === 'string') {

        // Wrap string values with quotes: value -> "'value'"
        validMappedAnswers[key] = `"'${validMappedAnswers[key]}'"`
      }
    })


    console.log('publicodes situation set to ', validMappedAnswers)
    engine.setSituation(validMappedAnswers)


    const results: EligibilityResults = {
      eligibleDispositifs: [],
      potentialDispositifs: [],
      ineligibleDispositifs: [],
    }

    for (const dispositif of dispositifsToEvaluate) {
      try {
        const evaluation = engine.evaluate(dispositif.id + " . eligibilite")
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

    console.log('dispositifs évalués', results)
    return results
  }

  return {
    calculateEligibility,
  }
}
