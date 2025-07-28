import {
  Entites,
  FAMILLE_ID,
  FOYER_FISCAL_ID,
  INDIVIDU_ID,
  MENAGE_ID,
  UNDEFINED_ENTITY_ID,
} from '~/utils/openfisca/constants'
import { datePeriods, getCurrentPeriod } from '~/utils/openfisca/date_periods'
import {
  UndefinedValueError,
  UnexpectedValueError,
  UnknownEntityError,
  UnknownVariableError,
} from '~/utils/openfisca/errors'
import { formatSurveyAnswerToRequest, formatSurveyQuestionToRequest } from '~/utils/openfisca/formatters'
import {
  famillesQuestionsVariables,
  foyersFiscauxQuestionsVariables,
  individusQuestionsVariables,
  menagesQuestionsVariables,
} from '~/utils/openfisca/questions_variables'
import {
  famillesVariables,
  foyersFiscauxVariables,
  individusVariables,
  menagesVariables,
} from '~/utils/openfisca/variables'
/**
 * Entity utilities for OpenFisca calculations
 */

/**
 * Initialize an empty OpenFisca request structure
 */
function initRequest(): OpenFiscaCalculationRequest {
  return {
    individus: {
      [INDIVIDU_ID]: {},
    },
    menages: {
      [MENAGE_ID]: {
        personne_de_reference: [INDIVIDU_ID],
        conjoint: [],
        enfants: [],
      },
    },
    foyers_fiscaux: {
      [FOYER_FISCAL_ID]: {
        declarants: [INDIVIDU_ID],
        personnes_a_charge: [],
      },
    },
    familles: {
      [FAMILLE_ID]: {
        parents: [INDIVIDU_ID],
        enfants: [],
      },
    },
  }
}

/**
 * Check if variable value should be updated based on specific business rules
 */
function shouldUpdateExistingVariable(
  formattedVariableName: string,
  existingValue: unknown,
  answerKey: string,
  answerValue: boolean | number | string,
): boolean {
  // Special case for demenagement
  if (
    formattedVariableName === 'statut_occupation_logement'
    && existingValue === 'locataire_vide'
  ) {
    console.warn(`Transcription mise à jour pour '${formattedVariableName}': '${existingValue}' suite à l'input '${answerKey}': '${answerValue}'`)
    return true
  }
  return false
}

/**
 * Process a dispatch mapping and return formatted answer
 */
function processDispatchMapping(
  mapping: OpenFiscaMapping,
  answerKey: string,
  answerValue: boolean | number | string,
): Record<string, VariableValueOnPeriod> {
  if ('dispatch' in mapping) {
    return mapping.dispatch(answerKey, answerValue, mapping.period)
  }
  throw new Error(`Invalid dispatch mapping for ${answerKey}`)
}

/**
 * Process a direct variable mapping and return formatted answer
 */
function processDirectMapping(
  mapping: OpenFiscaMapping,
  answerValue: boolean | number | string,
): Record<string, VariableValueOnPeriod> {
  if ('openfiscaVariableName' in mapping) {
    const period = getCurrentPeriod(mapping.period)
    return formatSurveyAnswerToRequest(mapping.openfiscaVariableName, period, answerValue)
  }
  throw new Error(`Invalid direct mapping`)
}

/**
 * Update request with formatted answer, handling existing values appropriately
 */
function updateRequestWithAnswer(
  request: OpenFiscaCalculationRequest,
  entity: Entites,
  entityId: string,
  formattedAnswer: Record<string, VariableValueOnPeriod>,
  answerKey: string,
  answerValue: boolean | number | string,
): OpenFiscaCalculationRequest {
  const formattedVariableName = Object.keys(formattedAnswer)[0]
  const period = getCurrentPeriod('MONTH') // This should be more dynamic based on thg

  const existingVariable = request[entity][entityId][formattedVariableName]

  if (existingVariable) {
    if (!Array.isArray(existingVariable)) {
      const existingValue = existingVariable[period]

      if (shouldUpdateExistingVariable(formattedVariableName, existingValue, answerKey, answerValue)) {
        request[entity][entityId][formattedVariableName] = { ...formattedAnswer[formattedVariableName] }
      }
      else {
        console.error(`Variable '${formattedVariableName}' already exists with value '${existingValue}' for entity '${entity}' and ID '${entityId}'. Not updating with new value '${answerValue}'.`)
      }
    }
    else {
      /**
       * @todo Handle array case if needed ??
       */
    }
  }
  else {
    // First time setting this variable
    request[entity][entityId][formattedVariableName] = { ...formattedAnswer[formattedVariableName] }
  }

  return request
}

/**
 * Get the entity ID for a given entity type
 */
function getEntityId(entity: Entites): string {
  switch (entity) {
    case Entites.Individus:
      return INDIVIDU_ID
    case Entites.Menages:
      return MENAGE_ID
    case Entites.FoyersFiscaux:
      return FOYER_FISCAL_ID
    case Entites.Familles:
      return FAMILLE_ID
    default:
      console.error(`Entité inconnue : ${entity}`)
      return UNDEFINED_ENTITY_ID
  }
}

/**
 * Add a survey answer to the OpenFisca request
 */
function addSurveyAnswerToRequest(
  answerKey: string,
  answerValue: boolean | number | string | undefined | string[],
  mapping: AidesSimplifieesMapping,
  entity: Entites,
  request: OpenFiscaCalculationRequest,
): OpenFiscaCalculationRequest {
  // Skip excluded mappings
  if ('exclude' in mapping && mapping.exclude === true) {
    return request
  }

  // Validate answer value
  if (answerValue === undefined) {
    throw new UndefinedValueError(answerKey)
  }

  if (
    typeof answerValue !== 'boolean'
    && typeof answerValue !== 'number'
    && typeof answerValue !== 'string'
  ) {
    throw new UnexpectedValueError(answerKey)
  }

  // Validate entity
  const entityId = getEntityId(entity)
  if (entityId === UNDEFINED_ENTITY_ID) {
    console.error(`Variable '${answerKey}' d'entité imprévue ou inconnue: ${entity}`)
    throw new UnknownEntityError(answerKey)
  }

  // Process mapping and format answer
  let formattedAnswer: Record<string, VariableValueOnPeriod>

  if ('dispatch' in mapping) {
    formattedAnswer = processDispatchMapping(mapping, answerKey, answerValue)
  }
  else if ('openfiscaVariableName' in mapping) {
    formattedAnswer = processDirectMapping(mapping, answerValue)
  }
  else {
    throw new Error(`Invalid mapping for ${answerKey}`)
  }

  // Update request with the formatted answer
  return updateRequestWithAnswer(request, entity, entityId, formattedAnswer, answerKey, answerValue)
}

/**
 * Add a survey question to the OpenFisca request
 */
function addSurveyQuestionToRequest(
  questionKey: string,
  mapping: OpenFiscaMapping,
  entity: Entites,
  request: OpenFiscaCalculationRequest,
): OpenFiscaCalculationRequest {
  if (!('openfiscaVariableName' in mapping)) {
    console.error(`Variable '${questionKey}' does not have openfiscaVariableName`)
    throw new Error(`Invalid mapping for ${questionKey}`)
  }

  const openfiscaVariableName = mapping.openfiscaVariableName
  const period = getCurrentPeriod(mapping.period) // This should be more dynamic based on thg
  const formattedQuestion = formatSurveyQuestionToRequest(openfiscaVariableName, period)

  const entityId = getEntityId(entity)
  if (entityId === UNDEFINED_ENTITY_ID) {
    console.error(`Variable '${questionKey}' d'entité imprévue ou inconne: ${entity}`)
    throw new UnknownEntityError(questionKey)
  }

  request[entity][entityId][openfiscaVariableName] = {
    ...formattedQuestion[openfiscaVariableName],
  }
  return request
}

/**
 * Process a single survey answer and add it to the request
 */
function processSurveyAnswer(
  request: OpenFiscaCalculationRequest,
  answerKey: string,
  answerValue: boolean | number | string | undefined | string[],
): OpenFiscaCalculationRequest {
  try {
    // Try to find the mapping in each entity type
    if (answerKey in individusVariables) {
      return addSurveyAnswerToRequest(
        answerKey,
        answerValue,
        individusVariables[answerKey],
        Entites.Individus,
        request,
      )
    }

    if (answerKey in menagesVariables) {
      return addSurveyAnswerToRequest(
        answerKey,
        answerValue,
        menagesVariables[answerKey],
        Entites.Menages,
        request,
      )
    }

    if (answerKey in famillesVariables) {
      return addSurveyAnswerToRequest(
        answerKey,
        answerValue,
        famillesVariables[answerKey],
        Entites.Familles,
        request,
      )
    }

    if (answerKey in foyersFiscauxVariables) {
      return addSurveyAnswerToRequest(
        answerKey,
        answerValue,
        foyersFiscauxVariables[answerKey],
        Entites.FoyersFiscaux,
        request,
      )
    }

    console.error(`Variable d'entrée de formulaire inconnue : ${answerKey}`)
    throw new UnknownVariableError(answerKey)
  }
  catch (error) {
    if (
      error instanceof UnknownVariableError
      || error instanceof UnknownEntityError
      || error instanceof UnexpectedValueError
      || error instanceof UndefinedValueError
    ) {
      console.warn(`Donnée '${answerKey}' non transcrite dans la requête de calcul suite à l'erreur '${error}'.`)
    }
    else {
      console.error(`Donnée '${answerKey}' non transcrite dans la requête de calcul suite à l'erreur inattendue '${error}'.`)
    }
    return request
  }
}

/**
 * Add special business logic for scholarship handling
 */
function addScolariteBusinessLogic(
  request: OpenFiscaCalculationRequest,
  answers: SurveyAnswers,
): OpenFiscaCalculationRequest {
  // Check if "bourse_lycee" exists directly in famillesVariables
  const bourseLyceesInFamilies = Object.keys(famillesVariables).includes('bourse_lycee')

  // Special case for Parcoursup mobility with scholarship
  if (
    answers.boursier === true
    && answers['etudiant-mobilite'] === 'parcoursup-nouvelle-region'
    && !bourseLyceesInFamilies
  ) {
    try {
      return addSurveyAnswerToRequest(
        'bourse_lycee',
        1,
        famillesVariables['montant-bourse-lycee'],
        Entites.Familles,
        request,
      )
    }
    catch (error) {
      console.warn(`Could not add scholarship business logic: ${error}`)
    }
  }

  return request
}

function addAnswersToRequest(
  request: OpenFiscaCalculationRequest,
  answers: SurveyAnswers,
): OpenFiscaCalculationRequest {
  // Process each answer
  for (const [answerKey, answerValue] of Object.entries(answers)) {
    request = processSurveyAnswer(request, answerKey, answerValue)
  }

  // Apply special business logic
  request = addScolariteBusinessLogic(request, answers)

  return request
}

/**
 * Add survey questions to the OpenFisca request
 */
function addQuestionsToRequest(
  request: OpenFiscaCalculationRequest,
  questions: string[],
): OpenFiscaCalculationRequest {
  for (const questionKey of questions) {
    try {
      if (questionKey in individusQuestionsVariables) {
        request = addSurveyQuestionToRequest(
          questionKey,
          individusQuestionsVariables[questionKey],
          Entites.Individus,
          request,
        )
      }
      else if (questionKey in menagesQuestionsVariables) {
        request = addSurveyQuestionToRequest(
          questionKey,
          menagesQuestionsVariables[questionKey],
          Entites.Menages,
          request,
        )
      }
      else if (questionKey in famillesQuestionsVariables) {
        request = addSurveyQuestionToRequest(
          questionKey,
          famillesQuestionsVariables[questionKey],
          Entites.Familles,
          request,
        )
      }
      else if (questionKey in foyersFiscauxQuestionsVariables) {
        request = addSurveyQuestionToRequest(
          questionKey,
          foyersFiscauxQuestionsVariables[questionKey],
          Entites.FoyersFiscaux,
          request,
        )
      }
      else {
        console.error(`Variable de question inconnue : ${questionKey}`)
        throw new UnknownVariableError(questionKey)
      }
    }
    catch (anyError) {
      // UnknownVariableError, UnknownEntityError, UnexpectedValueError, UndefinedValueError
      console.error(
        `Question '${questionKey}' non transcrite dans la requête de calcul suite à l'erreur '${anyError}'.`,
      )
    }
  }

  return request
}

function clampInputsInRequest(request: OpenFiscaCalculationRequest) {
  // SITUATION PERSONNELLE

  // TODO: for consistency with the user situation, the form should ask about the nationality
  const welcomeToFrance = 'FR'
  const formattedNationalite = formatSurveyAnswerToRequest('nationalite', datePeriods.MONTH, welcomeToFrance)
  request[Entites.Individus][INDIVIDU_ID].nationalite = { ...formattedNationalite.nationalite }

  // LOGEMENT

  const dateEntreeLogement = datePeriods.MONTH_NEXT
  const formattedDateEntreeLogement = formatSurveyAnswerToRequest(
    'date_entree_logement',
    datePeriods.MONTH,
    dateEntreeLogement,
  )
  request[Entites.Menages][MENAGE_ID].date_entree_logement = {
    ...formattedDateEntreeLogement.date_entree_logement,
  }

  // ETUDES (+ NOUVELLE ACADEMIE)

  // if 'parcoursup-nouvelle-region' value is chosen at 'etudiant-mobilite' => 'sortie_academie' à true
  const sortieAcademie = request[Entites.Individus][INDIVIDU_ID].sortie_academie
  let sortieAcademieApresTerminale = false
  if (sortieAcademie) {
    sortieAcademieApresTerminale = request[Entites.Individus][INDIVIDU_ID].sortie_academie[datePeriods.MONTH] as boolean
  }

  if (sortieAcademie && sortieAcademieApresTerminale) {
    const formattedAnneeEtude = formatSurveyAnswerToRequest('annee_etude', datePeriods.MONTH, 'terminale')
    request[Entites.Individus][INDIVIDU_ID].annee_etude = { ...formattedAnneeEtude.annee_etude }
  }

  // if 'master-nouvelle-zone' value is chosen at 'etudiant-mobilite' => 'sortie_region_academique' à true
  if (request[Entites.Individus][INDIVIDU_ID].sortie_region_academique) {
    const sortieAcademieApresL3ouM1 = request[Entites.Individus][INDIVIDU_ID]
      .sortie_region_academique[datePeriods.MONTH] as boolean
    if (sortieAcademieApresL3ouM1) {
      // TODO: for consistency with the user situation, the form should ask about the university level
      const welcomeToMaster1 = 'master_1' // could as well be 'licence_3' here
      const formattedAnneeEtude = formatSurveyAnswerToRequest('annee_etude', datePeriods.MONTH, welcomeToMaster1)
      request[Entites.Individus][INDIVIDU_ID].annee_etude = { ...formattedAnneeEtude.annee_etude }
    }
  }

  return request
}

export function buildCalculationRequest(
  answers: SurveyAnswers,
  questions: string[],
): OpenFiscaCalculationRequest {
  let request = initRequest()
  request = addAnswersToRequest(request, answers) // Add user's answers to the request
  request = addQuestionsToRequest(request, questions) // Add questions to the request
  request = clampInputsInRequest(request) // Clamp inputs to ensure they are within expected ranges
  return request
}
