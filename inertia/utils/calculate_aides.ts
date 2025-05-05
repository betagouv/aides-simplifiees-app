import axios from 'axios'
import {
  famillesVariables,
  foyersFiscauxVariables,
  individusVariables,
  menagesVariables,
} from '~/utils/aides_mapping_inputs'

import {
  famillesQuestionsVariables,
  foyersFiscauxQuestionsVariables,
  individusQuestionsVariables,
  menagesQuestionsVariables,
} from '~/utils/aides_mapping_questions'

import {
  UndefinedValueError,
  UnexpectedValueError,
  UnknownEntityError,
  UnknownPeriodError,
  UnknownVariableError,
} from '~/utils/errors'

function initDates() {
  const today = new Date()
  const todayAsString = today.toISOString() // YYYY-MM-DD
  const monthDate = todayAsString.slice(0, 7)
  const month = todayAsString.slice(5, 7)

  const monthPlusOne = new Date(today)
  monthPlusOne.setMonth(today.getMonth() + 1)
  const nextMonth = monthPlusOne.toISOString().slice(0, 7)

  const year = todayAsString.slice(0, 4)
  const previousYear = String(Number.parseInt(year) - 1)

  // rolling year format:
  // https://openfisca.org/doc/coding-the-legislation/35_periods.html#periods
  const rollingYear = `month:${previousYear}-${month}:12` // rolling in the past

  return {
    MONTH: monthDate,
    MONTH_NEXT: nextMonth,
    YEAR: year,
    YEAR_ROLLING: rollingYear,
  }
}

// init all periods once according to today's date
export const { MONTH, MONTH_NEXT, YEAR, YEAR_ROLLING } = initDates()
const ETERNITY_PERIOD = 'ETERNITY' // https://openfisca.org/doc/coding-the-legislation/35_periods.html#periods
const UNDEFINED_PERIOD_TYPE = 'PERIODE_DEFNITION_INCONNUE'

export const INDIVIDU_ID = 'usager'
export const MENAGE_ID = `menage_${INDIVIDU_ID}`
export const FOYER_FISCAL_ID = `foyer_fiscal_${INDIVIDU_ID}`
export const FAMILLE_ID = `famille_${INDIVIDU_ID}`
const UNDEFINED_ENTITY_ID = 'IDENTIFIANT_ENTITE_INCONNUE'

export enum Entites {
  Individus = 'individus',
  Menages = 'menages',
  FoyerFiscaux = 'foyers_fiscaux',
  Familles = 'familles',
}

function getEntityId(entity: Entites): string {
  switch (entity) {
    case Entites.Individus:
      return INDIVIDU_ID

    case Entites.Menages:
      return MENAGE_ID

    case Entites.FoyerFiscaux:
      return FOYER_FISCAL_ID

    case Entites.Familles:
      return FAMILLE_ID

    default:
      // should not happen for simulators calling openfisca-france
      // (the entities list might change for a simulator calculating beyond natural persons)
      console.error(`Entité inconnue : ${entity}`)
      return UNDEFINED_ENTITY_ID
  }
}

export function getPeriod(periodType: 'ETERNITY' | 'YEAR' | 'YEAR_ROLLING' | 'MONTH'): string {
  switch (periodType) {
    case 'MONTH':
      return MONTH
    case 'YEAR':
      return YEAR
    case 'YEAR_ROLLING':
      return YEAR_ROLLING
    case 'ETERNITY':
      return ETERNITY_PERIOD
    default:
      console.error(`Période inconnue : ${periodType}`)
      return UNDEFINED_PERIOD_TYPE
  }
}

export function dispatchSituationProfessionnelle(
  answerKey: string,
  answerValue: boolean | number | string,
  periodType: 'ETERNITY' | 'YEAR' | 'YEAR_ROLLING' | 'MONTH',
): unknown {
  const period = getPeriod(periodType)
  if (period === UNDEFINED_PERIOD_TYPE) {
    console.error(`Variable '${answerKey}' de période imprévue ou inconnue: ${periodType}`)
    throw new UnknownPeriodError(answerKey)
  }

  let openfiscaVariableName

  if (answerValue === 'stage') {
    openfiscaVariableName = 'stagiaire'
    return formatSurveyAnswerToRequest(openfiscaVariableName, period, answerValue)
  }
  else if (answerValue === 'alternance') {
    openfiscaVariableName = 'alternant'
    return formatSurveyAnswerToRequest(openfiscaVariableName, period, answerValue)
  }
  else if (answerValue === 'salarie-hors-alternance') {
    openfiscaVariableName = 'activite' // TypesActivite possible values: https://legislation.fr.openfisca.org/activite
    return formatSurveyAnswerToRequest(openfiscaVariableName, period, 'actif')
  }
  else if (answerValue === 'sans-emploi') {
    openfiscaVariableName = 'activite' // TypesActivite possible values: https://legislation.fr.openfisca.org/activite
    return formatSurveyAnswerToRequest(openfiscaVariableName, period, 'chomeur')
  }
  else {
    console.debug(`Valeur inattendue ${answerKey}: ${answerValue}`)
    throw new UnexpectedValueError(answerKey)
  }
}

export function dispatchSituationLogement(
  answerKey: string,
  answerValue: boolean | number | string,
  periodType: 'ETERNITY' | 'YEAR' | 'YEAR_ROLLING' | 'MONTH',
): unknown {
  const period = getPeriod(periodType)
  if (period === UNDEFINED_PERIOD_TYPE) {
    console.error(`Variable '${answerKey}' de période imprévue ou inconnue: ${periodType}`)
    throw new UnknownPeriodError(answerKey)
  }

  const openfiscaVariableName = 'statut_occupation_logement'
  // possible values: https://legislation.fr.openfisca.org/statut_occupation_logement

  if (answerValue === 'locataire') {
    // TypesStatutOccupationLogement: 'locataire_foyer', 'locataire_hlm', 'locataire_meuble', 'locataire_vide'
    // exemple d'input 'type-logement': "logement-foyer"

    console.debug(
      `Transcription simplifiee de '${answerKey}': '${answerValue}' en '${openfiscaVariableName}': 'locataire_vide'.`,
    )

    console.debug(`Transcription pouvant être mise à jour en cas de valeur 'type-logement'`)
    return formatSurveyAnswerToRequest(openfiscaVariableName, period, 'locataire_vide')
  }
  else if (answerValue === 'proprietaire') {
    // TypesStatutOccupationLogement: 'proprietaire' (could also be a subset: 'primo_accedant')
    return formatSurveyAnswerToRequest(openfiscaVariableName, period, 'proprietaire')
  }
  else if (answerValue === 'heberge') {
    return formatSurveyAnswerToRequest(openfiscaVariableName, period, 'loge_gratuitement')
  }
  else if (answerValue === 'sans-domicile') {
    return formatSurveyAnswerToRequest(openfiscaVariableName, period, 'sans_domicile')
  }
  else {
    console.debug(`Valeur inattendue ${answerKey}: ${answerValue}`)
    throw new UnexpectedValueError(answerKey)
  }
}

export function dispatchTypeLogement(
  answerKey: string,
  answerValue: boolean | number | string,
  periodType: 'ETERNITY' | 'YEAR' | 'YEAR_ROLLING' | 'MONTH',
): unknown {
  const period = getPeriod(periodType)
  if (period === UNDEFINED_PERIOD_TYPE) {
    console.error(`Variable '${answerKey}' de période imprévue ou inconnue: ${periodType}`)
    throw new UnknownPeriodError(answerKey)
  }

  const openfiscaVariableName = 'statut_occupation_logement'
  if (answerValue === 'logement-non-meuble') {
    return formatSurveyAnswerToRequest(openfiscaVariableName, period, 'locataire_vide')
  }
  else if (answerValue === 'logement-meuble') {
    return formatSurveyAnswerToRequest(openfiscaVariableName, period, 'locataire_meuble')
  }
  else if (answerValue === 'logement-foyer') {
    return formatSurveyAnswerToRequest(openfiscaVariableName, period, 'locataire_foyer')
  }
  else {
    console.debug(`Valeur inattendue ${answerKey}: ${answerValue}`)
    throw new UnexpectedValueError(answerKey)
  }
}

export function dispatchEtudiantMobilite(
  answerKey: string,
  answerValue: boolean | number | string,
  periodType: 'ETERNITY' | 'YEAR' | 'YEAR_ROLLING' | 'MONTH',
) {
  const period = getPeriod(periodType)
  if (period === UNDEFINED_PERIOD_TYPE) {
    console.error(`Variable '${answerKey}' de période imprévue ou inconnue: ${periodType}`)
    throw new UnknownPeriodError(answerKey)
  }

  if (answerValue === 'parcoursup-nouvelle-region') {
    return formatSurveyAnswerToRequest('sortie_academie', period, true)
  }
  else if (answerValue === 'master-nouvelle-zone') {
    return formatSurveyAnswerToRequest('sortie_region_academique', period, true)
  }
  else if (answerValue === 'pas-de-mobilite') {
    // TODO: add formatSurveyAnswerToRequest('sortie_academie', period, false)
    // if university 1st year even if 'false' will have no effect on the calculation result
    return formatSurveyAnswerToRequest('sortie_region_academique', period, false)
  }
  else {
    console.debug(`Valeur inattendue ${answerKey}: ${answerValue}`)
    throw new UnexpectedValueError(answerKey)
  }
}

function initRequest(): OpenFiscaCalculationRequest {
  console.debug('initRequest...')
  const request: OpenFiscaCalculationRequest = {
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
  return request
}

/**
 * for a survey answer found in the mapping, format it for an openfisca web API request
 * with the openfisca variable period
 * and the answer value already validated for openfisca usage
 */
function formatSurveyAnswerToRequest(
  openfiscaVariableName: string,
  period: string,
  value: boolean | number | string, // VariableValueOnPeriod allowed types
): { [openfiscaKey: string]: VariableValueOnPeriod } {
  const result: { [key: string]: VariableValueOnPeriod } = {}
  result[openfiscaVariableName] = {
    [period]: value,
  }
  return result
}

/**
 * one step of the openfisca web API request building:
 * for a survey answer found in the mapping, add the answer data to the given request
 * unless it's a survey answer that should not be sent to the calculation (excluded answers)
 * @throws UnknownEntityError if the given entity is not referenced for the current simulation
 * @throws UndefinedValueError if some issue occured on the survey input
 * @throws UnexpectedValueError if a mapping is defined on an unexpected form input type
 */
function addSurveyAnswerToRequest(
  answerKey: string,
  answerValue: boolean | number | string | undefined,
  mapping: AidesSimplifieesMapping,
  entity: Entites,
  request: OpenFiscaCalculationRequest,
): OpenFiscaCalculationRequest {
  if (!('exclude' in mapping)) {
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

    const period = getPeriod(mapping.period)
    let formattedAnswer: { [openfiscaKey: string]: VariableValueOnPeriod } | undefined
    if ('dispatch' in mapping) {
      // dispatch and manage period in dispatch
      formattedAnswer = mapping.dispatch(answerKey, answerValue, mapping.period) as {
        [openfiscaKey: string]: VariableValueOnPeriod
      }
    }
    else {
      formattedAnswer = formatSurveyAnswerToRequest(
        mapping.openfiscaVariableName,
        period,
        answerValue,
      )
    }

    const entityId = getEntityId(entity)
    if (entityId === UNDEFINED_ENTITY_ID) {
      console.error(`Variable '${answerKey}' d'entité imprévue ou inconnue: ${entity}`)
      throw new UnknownEntityError(answerKey)
    }

    const formattedVariableName = Object.keys(formattedAnswer)[0]
    if (request[entity][entityId][formattedVariableName]) {
      // MANAGING VERY SPECIFIC CASE 🙀
      // a value already exists in the request for formattedVariableName
      // we expect it to be at the same period as, for now, we set each variable once (for one period only)
      const existingValue = request[entity][entityId][formattedVariableName][period]
      if (
        formattedVariableName === 'statut_occupation_logement'
        && existingValue === 'locataire_vide'
      ) {
        // expected: one of dispatchSituationLogement or dispatchTypeLogement already updated the value once
        // we allow updates as 'locataire_vide' is kind of a default value for 'locataire'
        // (happens at least when dispatchSituationLogement is called before dispatchTypeLogement)
        console.warn(
          `Transcription mise à jour pour '${formattedVariableName}': '${existingValue}' suite input '${answerKey}': '${answerValue}'`,
        )
        request[entity][entityId][formattedVariableName] = {
          ...formattedAnswer[formattedVariableName],
        }
      }
      else {
        // Instead of throwing an error, we do nothing
        console.error(
          `Transcription aurait étéremplacée pour '${formattedVariableName}': '${existingValue}' par la nouvelle valeur de '${answerKey}': '${answerValue}'`,
        )
        // request[entity][entityId][formattedVariableName] = existingValue

        // not one of the expected very specific cases :-o
        // console.error(`Valeur déjà existante pour '${formattedVariableName}'='${existingValue}'. Input complémentaire ignoré : '${answerKey}'='${answerValue}'`)
        // throw new UnexpectedValueUpdateError(answerKey)
      }
    }
    else {
      // formattedVariableName value is set for the first time here
      request[entity][entityId][formattedVariableName] = {
        ...formattedAnswer[formattedVariableName],
      }
    }
  }
  return request
}

/**
 * format a question to the openfisca web API
 * to calculate the variable defined in variableMapping
 */
function formatSurveyQuestionToRequest(openfiscaVariableName: string, period: string) {
  const result: { [key: string]: VariableToCalculateOnPeriod } = {}
  result[openfiscaVariableName] = {
    [period]: null,
  }
  return result
}

function addSurveyQuestionToRequest(
  questionKey: string,
  mapping: OpenFiscaMapping,
  entity: Entites,
  request: OpenFiscaCalculationRequest,
): OpenFiscaCalculationRequest {
  const openfiscaVariableName = mapping.openfiscaVariableName
  const period = getPeriod(mapping.period)
  const formattedQuestion = formatSurveyQuestionToRequest(openfiscaVariableName, period)

  const entityId = getEntityId(entity)
  if (entityId === UNDEFINED_ENTITY_ID) {
    console.error(`Variable '${questionKey}' d'entité imprévue ou inconne: ${entity}`)
    throw new UnknownEntityError(questionKey)
  }

  request[entity][entityId][openfiscaVariableName] = { ...formattedQuestion[openfiscaVariableName] }
  return request
}

function addAnswersToRequest(
  request: OpenFiscaCalculationRequest,
  answers: SurveyAnswers,
): OpenFiscaCalculationRequest {
  for (const [answerKey, answerValue] of Object.entries(answers)) {
    const typedValue = answerValue as unknown as string | number | boolean | undefined // bypass 'any' type infered by loop
    try {
      if (answerKey in individusVariables) {
        request = addSurveyAnswerToRequest(
          answerKey,
          typedValue,
          individusVariables[answerKey],
          Entites.Individus,
          request,
        )
      }
      else if (answerKey in menagesVariables) {
        request = addSurveyAnswerToRequest(
          answerKey,
          typedValue,
          menagesVariables[answerKey],
          Entites.Menages,
          request,
        )
      }
      else if (answerKey in famillesVariables) {
        request = addSurveyAnswerToRequest(
          answerKey,
          typedValue,
          famillesVariables[answerKey],
          Entites.Familles,
          request,
        )
      }
      else if (answerKey in foyersFiscauxVariables) {
        request = addSurveyAnswerToRequest(
          answerKey,
          typedValue,
          foyersFiscauxVariables[answerKey],
          Entites.FoyerFiscaux,
          request,
        )
      }
      else {
        console.error(`Variable d'entrée de formulaire inconnue : ${answerKey}`)
        throw new UnknownVariableError(answerKey)
      }
    }
    catch (error) {
      if (
        error instanceof UnknownVariableError
        || error instanceof UnknownEntityError
        || error instanceof UnexpectedValueError
        || error instanceof UndefinedValueError
      ) {
        console.warn(
          `Donnée '${answerKey}' non transcrite dans la requête de calcul suite à l'erreur '${error}'.`,
        )
      }
      else {
        console.error(
          `Donnée '${answerKey}' non transcrite dans la requête de calcul suite à l'erreur inattendue '${error}'.`,
        )
      }
    }
  }

  // Check if "bourse_lycee" exists directly in famillesVariables (properly named variable)
  const bourseLyceesInFamilies = Object.keys(famillesVariables).includes('bourse_lycee')

  // Using the same logic but with answers (the user input) instead of the mapping objects
  if (
    // If user has answered "boursier" question with true
    answers.boursier === true
    // And user has selected parcoursup mobility
    && answers['etudiant-mobilite'] === 'parcoursup-nouvelle-region'
    // And we need to add bourse_lycee because it's not directly in famillesVariables
    && !bourseLyceesInFamilies
  ) {
    // Add the montant-bourse-lycee mapping for bourse_lycee, to the proper entity (Familles)
    request = addSurveyAnswerToRequest(
      'bourse_lycee',
      1,
      famillesVariables['montant-bourse-lycee'],
      Entites.Familles,
      request,
    )
  }

  // TODO add additional information from gathered data?
  // ex: logement_conventionne
  return request
}

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
          Entites.FoyerFiscaux,
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
  const formattedNationalite = formatSurveyAnswerToRequest('nationalite', MONTH, welcomeToFrance)
  request[Entites.Individus][INDIVIDU_ID].nationalite = { ...formattedNationalite.nationalite }

  // LOGEMENT

  const dateEntreeLogement = MONTH_NEXT
  const formattedDateEntreeLogement = formatSurveyAnswerToRequest(
    'date_entree_logement',
    MONTH,
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
    sortieAcademieApresTerminale = request[Entites.Individus][INDIVIDU_ID].sortie_academie[
      MONTH
    ] as boolean
  }

  if (sortieAcademie && sortieAcademieApresTerminale) {
    const formattedAnneeEtude = formatSurveyAnswerToRequest('annee_etude', MONTH, 'terminale')
    request[Entites.Individus][INDIVIDU_ID].annee_etude = { ...formattedAnneeEtude.annee_etude }
  }

  // if 'master-nouvelle-zone' value is chosen at 'etudiant-mobilite' => 'sortie_region_academique' à true
  if (request[Entites.Individus][INDIVIDU_ID].sortie_region_academique) {
    const sortieAcademieApresL3ouM1 = request[Entites.Individus][INDIVIDU_ID]
      .sortie_region_academique[MONTH] as boolean
    if (sortieAcademieApresL3ouM1) {
      // TODO: for consistency with the user situation, the form should ask about the university level
      const welcomeToMaster1 = 'master_1' // could as well be 'licence_3' here
      const formattedAnneeEtude = formatSurveyAnswerToRequest(
        'annee_etude',
        MONTH,
        welcomeToMaster1,
      )
      request[Entites.Individus][INDIVIDU_ID].annee_etude = { ...formattedAnneeEtude.annee_etude }
    }
  }

  return request
}

export function buildRequest(
  answers: SurveyAnswers,
  questions: string[],
): OpenFiscaCalculationRequest {
  console.debug('buildRequest...')
  let request: OpenFiscaCalculationRequest = initRequest()
  // sets: request[some entity][the entity id]

  console.debug(request)

  request = addAnswersToRequest(request, answers) // user answers
  request = addQuestionsToRequest(request, questions) // simulator questions to rules engine
  request = clampInputsInRequest(request)

  return request
}

export async function fetchOpenFiscaFranceCalculation(
  request: OpenFiscaCalculationRequest,
): Promise<OpenFiscaCalculationResponse> {
  // Standardiser la date de naissance pour optimiser le cache
  standardizeBirthDateForCache(request)

  console.debug('Requête à transmettre au serveur :')

  console.debug(request)

  try {
    // Utiliser Axios pour faire la requête avec des en-têtes supplémentaires
    const response = await axios.post('/api/calculate', request, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      withCredentials: false
    })

    return response.data
  }
  catch (error: any) {
    throw new Error(error)
  }
}

/**
 * Standardise la date de naissance pour optimiser le cache Nginx
 * Convertit toutes les dates de naissance en "1er janvier de l'année correspondant à l'âge"
 * Cela permet à deux personnes du même âge d'avoir la même date dans la requête
 */
function standardizeBirthDateForCache(request: OpenFiscaCalculationRequest): void {
  // Parcourir tous les individus dans la requête
  for (const individuId in request.individus) {
    const individu = request.individus[individuId]

    // Vérifier si une date de naissance est définie
    if (individu.date_naissance) {
      const today = new Date()
      const currentYear = today.getFullYear()

      // Récupérer la date de naissance originale (format: YYYY-MM-DD)
      // La clé est généralement "ETERNITY"
      const period = Object.keys(individu.date_naissance)[0]
      const originalBirthDate = individu.date_naissance[period] as string

      if (originalBirthDate) {
        // Calculer l'âge réel à partir de la date originale de façon précise
        const birthDate = new Date(originalBirthDate)

        // Calcul correct de l'âge en tenant compte du mois et du jour
        let age = today.getFullYear() - birthDate.getFullYear()

        // Ajuster l'âge si l'anniversaire n'est pas encore passé cette année
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }

        // Créer une nouvelle date standardisée : 1er janvier de l'année correspondant à l'âge
        const standardizedYear = currentYear - age
        const standardizedDate = `${standardizedYear}-01-01`

        // Remplacer la date de naissance dans la requête
        individu.date_naissance[period] = standardizedDate
      }
    }
  }
}
