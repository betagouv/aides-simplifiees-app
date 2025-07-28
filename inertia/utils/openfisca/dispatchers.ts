import {
  ACTIVITY_STATUS,
  FORM_VALUES,
  LOGEMENT_STATUS,
  UNDEFINED_PERIOD_TYPE,
} from '~/utils/openfisca/constants'
import { getCurrentPeriod } from '~/utils/openfisca/date_periods'
import { UnexpectedValueError, UnknownPeriodError } from '~/utils/openfisca/errors'
/**
 * Dispatch utilities for mapping form values to OpenFisca variables
 */
import { formatSurveyAnswerToRequest } from '~/utils/openfisca/formatters'

/**
 * Dispatch professional situation values to OpenFisca variables
 */
export const dispatchSituationProfessionnelle: DispatchFunction = function (
  answerKey: string,
  answerValue: boolean | number | string,
  periodType: PeriodType,
): Record<string, VariableValueOnPeriod> {
  const period = getCurrentPeriod(periodType)
  if (period === UNDEFINED_PERIOD_TYPE) {
    console.error(`Variable '${answerKey}' de période imprévue ou inconnue: ${periodType}`)
    throw new UnknownPeriodError(answerKey)
  }

  switch (answerValue) {
    case FORM_VALUES.STAGE:
      return formatSurveyAnswerToRequest('stagiaire', period, answerValue)
    case FORM_VALUES.ALTERNANCE:
      return formatSurveyAnswerToRequest('alternant', period, answerValue)
    case FORM_VALUES.SALARIE_HORS_ALTERNANCE:
      return formatSurveyAnswerToRequest('activite', period, ACTIVITY_STATUS.ACTIF)
    case FORM_VALUES.SANS_EMPLOI:
      return formatSurveyAnswerToRequest('activite', period, ACTIVITY_STATUS.CHOMEUR)
    default:
      console.debug(`Valeur inattendue ${answerKey}: ${answerValue}`)
      throw new UnexpectedValueError(answerKey)
  }
}

/**
 * Dispatch situation-logment values to OpenFisca variables
 */
export const dispatchSituationLogement: DispatchFunction = function (
  answerKey: string,
  answerValue: boolean | number | string,
  periodType: PeriodType,
): Record<string, VariableValueOnPeriod> {
  const period = getCurrentPeriod(periodType)
  if (period === UNDEFINED_PERIOD_TYPE) {
    console.error(`Variable '${answerKey}' de période imprévue ou inconnue: ${periodType}`)
    throw new UnknownPeriodError(answerKey)
  }

  const openfiscaVariableName = 'statut_occupation_logement'

  switch (answerValue) {
    case FORM_VALUES.LOCATAIRE:
      console.debug(
        `Transcription simplifiee de '${answerKey}': '${answerValue}' en '${openfiscaVariableName}': '${LOGEMENT_STATUS.LOCATAIRE_VIDE}'.`,
      )
      console.debug(`Transcription pouvant être mise à jour en cas de valeur 'type-logement'`)
      return formatSurveyAnswerToRequest(openfiscaVariableName, period, LOGEMENT_STATUS.LOCATAIRE_VIDE)
    case FORM_VALUES.PROPRIETAIRE:
      return formatSurveyAnswerToRequest(openfiscaVariableName, period, LOGEMENT_STATUS.PROPRIETAIRE)
    case FORM_VALUES.HEBERGE:
      return formatSurveyAnswerToRequest(openfiscaVariableName, period, LOGEMENT_STATUS.LOGE_GRATUITEMENT)
    case FORM_VALUES.SANS_DOMICILE:
      return formatSurveyAnswerToRequest(openfiscaVariableName, period, LOGEMENT_STATUS.SANS_DOMICILE)
    default:
      console.debug(`Valeur inattendue ${answerKey}: ${answerValue}`)
      throw new UnexpectedValueError(answerKey)
  }
}

/**
 * Dispatch type-logement values to OpenFisca variables
 */
export const dispatchTypeLogement: DispatchFunction = function (
  answerKey: string,
  answerValue: boolean | number | string,
  periodType: PeriodType,
): Record<string, VariableValueOnPeriod> {
  const period = getCurrentPeriod(periodType)
  if (period === UNDEFINED_PERIOD_TYPE) {
    console.error(`Variable '${answerKey}' de période imprévue ou inconnue: ${periodType}`)
    throw new UnknownPeriodError(answerKey)
  }

  const openfiscaVariableName = 'statut_occupation_logement'

  switch (answerValue) {
    case FORM_VALUES.LOGEMENT_NON_MEUBLE:
      return formatSurveyAnswerToRequest(openfiscaVariableName, period, LOGEMENT_STATUS.LOCATAIRE_VIDE)
    case FORM_VALUES.LOGEMENT_MEUBLE:
      return formatSurveyAnswerToRequest(openfiscaVariableName, period, LOGEMENT_STATUS.LOCATAIRE_MEUBLE)
    case FORM_VALUES.LOGEMENT_FOYER:
      return formatSurveyAnswerToRequest(openfiscaVariableName, period, LOGEMENT_STATUS.LOCATAIRE_FOYER)
    default:
      console.debug(`Valeur inattendue ${answerKey}: ${answerValue}`)
      throw new UnexpectedValueError(answerKey)
  }
}

/**
 * Dispatch etudiant-mobilite values to OpenFisca variables
 */
export const dispatchEtudiantMobilite: DispatchFunction = function (
  answerKey: string,
  answerValue: boolean | number | string,
  periodType: PeriodType,
): Record<string, VariableValueOnPeriod> {
  const period = getCurrentPeriod(periodType)
  if (period === UNDEFINED_PERIOD_TYPE) {
    console.error(`Variable '${answerKey}' de période imprévue ou inconnue: ${periodType}`)
    throw new UnknownPeriodError(answerKey)
  }

  switch (answerValue) {
    case FORM_VALUES.PARCOURSUP_NOUVELLE_REGION:
      return formatSurveyAnswerToRequest('sortie_academie', period, true)
    case FORM_VALUES.MASTER_NOUVELLE_ZONE:
      return formatSurveyAnswerToRequest('sortie_region_academique', period, true)
    case FORM_VALUES.PAS_DE_MOBILITE:
      // TODO: add formatSurveyAnswerToRequest('sortie_academie', period, false)
      // if university 1st year even if 'false' will have no effect on the calculation result
      return formatSurveyAnswerToRequest('sortie_region_academique', period, false)
    default:
      console.debug(`Valeur inattendue ${answerKey}: ${answerValue}`)
      throw new UnexpectedValueError(answerKey)
  }
}
