import {
  Entites,
  FAMILLE_ID,
  FOYER_FISCAL_ID,
  INDIVIDU_ID,
  MENAGE_ID,
} from '~/services/openfisca/constants'
import { getCurrentPeriod } from '~/services/openfisca/date_periods'
import { UnknownVariableError } from '~/services/openfisca/errors'
import {
  famillesQuestionsVariables,
  foyersFiscauxQuestionsVariables,
  individusQuestionsVariables,
  menagesQuestionsVariables,
} from '~/services/openfisca/questions_variables'

/**
 * Add deduced results based on calculated values
 */
function addDeducedResults(results: SimulationResultsAides): SimulationResultsAides {
  const resultsCopy = { ...results }

  // APL eligibility based on amount
  if ('aide-personnalisee-logement' in results) {
    const aplAmount = results['aide-personnalisee-logement'] as number
    resultsCopy['aide-personnalisee-logement-eligibilite'] = aplAmount > 0
  }

  // Master mobility eligibility based on amount
  if ('mobilite-master-1' in results) {
    const mobiliteMaster1Amount = results['mobilite-master-1'] as number
    resultsCopy['mobilite-master-1-eligibilite'] = mobiliteMaster1Amount > 0
  }

  // Parcoursup mobility eligibility based on amount
  if ('mobilite-parcoursup' in results) {
    const mobiliteParcoursSupAmount = results['mobilite-parcoursup'] as number
    resultsCopy['mobilite-parcoursup-eligibilite'] = mobiliteParcoursSupAmount > 0
  }

  // Locapass amount based on eligibility
  if ('locapass-eligibilite' in results) {
    const locapassEligibilite = results['locapass-eligibilite'] as boolean
    resultsCopy.locapass = locapassEligibilite ? 1200 : 0
  }

  return resultsCopy
}

interface EntityConfig {
  // Variables contain OpenFisca mappings which have complex dispatch functions
  // Type kept as any due to OpenFisca's dynamic mapping structure
  variables: Record<string, any>
  id: string
  entity: Entites
}

/**
 * Extract a single result from API response for a given question
 */
function extractSingleResult(
  questionKey: string,
  entityConfig: EntityConfig,
  apiResponse: OpenFiscaCalculationResponse,
): number | boolean | null {
  if ('error' in apiResponse) {
    return null
  }

  const { variables, id, entity } = entityConfig

  if (!(questionKey in variables)) {
    return null
  }

  const questionMapping = variables[questionKey]
  if (!('openfiscaVariableName' in questionMapping)) {
    return null
  }

  try {
    const period = getCurrentPeriod(questionMapping.period)
    const values = apiResponse[entity][id][questionMapping.openfiscaVariableName]

    if (Array.isArray(values)) {
      return null // Skip arrays
    }

    const value = values[period]
    return (typeof value === 'number' || typeof value === 'boolean') ? value : null
  }
  catch (error) {
    console.error(`Error extracting result for ${questionKey}:`, error)
    return null
  }
}

/**
 * Process results for all entity configurations
 */
function processResultsForEntities(
  questionKey: string,
  apiResponse: OpenFiscaCalculationResponse,
): number | boolean | null {
  const entityConfigs: EntityConfig[] = [
    { variables: individusQuestionsVariables, id: INDIVIDU_ID, entity: Entites.Individus },
    { variables: menagesQuestionsVariables, id: MENAGE_ID, entity: Entites.Menages },
    { variables: famillesQuestionsVariables, id: FAMILLE_ID, entity: Entites.Familles },
    { variables: foyersFiscauxQuestionsVariables, id: FOYER_FISCAL_ID, entity: Entites.FoyersFiscaux },
  ]

  for (const config of entityConfigs) {
    const result = extractSingleResult(questionKey, config, apiResponse)
    if (result !== null) {
      return result
    }
  }

  return null
}

export function extractAidesResults(
  apiResponse: OpenFiscaCalculationResponse,
  resultsToExtract: string[],
): SimulationResultsAides {
  if ('error' in apiResponse) {
    console.error('Erreur dans la réponse de l\'API OpenFisca :', apiResponse.error)
    return {}
  }

  const results: SimulationResultsAides = {}

  // Process each requested result
  for (const questionKey of resultsToExtract) {
    try {
      const result = processResultsForEntities(questionKey, apiResponse)

      if (result !== null) {
        results[questionKey] = result
      }
      else {
        console.error(`Variable inconnue de réponse à la question : ${questionKey}`)
        throw new UnknownVariableError(questionKey)
      }
    }
    catch (error) {
      console.error(`Réponse à question '${questionKey}' non transcrite dans les résultats de simulation suite à l'erreur '${error}'.`)
    }
  }

  // Add computed results
  const enrichedResults = addDeducedResults(results)

  // Report missing results
  const missingResults = resultsToExtract.filter((key) => {
    return !Object.prototype.hasOwnProperty.call(enrichedResults, key)
  })

  if (missingResults.length > 0) {
    console.warn('Questions attendues mais non extraites de la réponse d\'API :', missingResults)
  }

  return enrichedResults
}
