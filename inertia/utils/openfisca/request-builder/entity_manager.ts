import type { Entites } from '../constants.js'
import type { RequestBuildError } from './types.js'
import { getCurrentPeriod } from '../date_periods.js'

/**
 * Base class for managing entity-specific logic in OpenFisca requests
 *
 * Each entity type (Individu, Menage, FoyerFiscal, Famille) has its own manager
 * that handles adding variables, validating values, and managing entity state.
 */
export abstract class EntityManager {
  protected errors: RequestBuildError[] = []
  protected entityId: string
  protected entityType: Entites

  constructor(entityId: string, entityType: Entites) {
    this.entityId = entityId
    this.entityType = entityType
  }

  /**
   * Add a variable to the entity
   *
   * @param variableName - OpenFisca variable name
   * @param value - Variable value
   * @param period - Period for the variable
   * @param answerKey - Original answer key (for error tracking)
   */
  abstract addVariable(
    variableName: string,
    value: boolean | number | string,
    period: string,
    answerKey: string,
  ): void

  /**
   * Get the entity data structure
   */
  abstract getEntity(): Record<string, unknown>

  /**
   * Check if a variable should be updated based on business rules
   *
   * @param variableName - Variable name
   * @param existingValue - Current value
   * @param newValue - New value to set
   * @param answerKey - Answer key for logging
   */
  protected shouldUpdateVariable(
    variableName: string,
    existingValue: unknown,
    newValue: boolean | number | string,
    answerKey: string,
  ): boolean {
    // Special case: demenagement updates statut_occupation_logement
    if (variableName === 'statut_occupation_logement' && existingValue === 'locataire_vide') {
      console.warn(
        `Transcription mise à jour pour '${variableName}': '${existingValue}' suite à l'input '${answerKey}': '${newValue}'`,
      )
      return true
    }

    return false
  }

  /**
   * Log a warning about variable conflict
   *
   * @param variableName - Variable name
   * @param existingValue - Current value
   * @param newValue - New value attempted
   * @param answerKey - Answer key
   */
  protected logVariableConflict(
    variableName: string,
    existingValue: unknown,
    newValue: boolean | number | string,
    answerKey: string,
  ): void {
    console.error(
      `Variable '${variableName}' already exists with value '${existingValue}' for entity '${this.entityType}' and ID '${this.entityId}'. Not updating with new value '${newValue}' from '${answerKey}'.`,
    )
  }

  /**
   * Add an error to the error collection
   *
   * @param error - Error to add
   */
  protected addError(error: RequestBuildError): void {
    this.errors.push(error)
  }

  /**
   * Get all errors collected during entity building
   */
  getErrors(): readonly RequestBuildError[] {
    return [...this.errors]
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0
  }

  /**
   * Get the entity ID
   */
  getEntityId(): string {
    return this.entityId
  }

  /**
   * Get the entity type
   */
  getEntityType(): Entites {
    return this.entityType
  }

  /**
   * Resolve period for a variable
   *
   * @param periodType - Period type from mapping
   * @returns Resolved period string
   */
  protected resolvePeriod(periodType?: PeriodType): string {
    return getCurrentPeriod(periodType || 'MONTH')
  }
}
