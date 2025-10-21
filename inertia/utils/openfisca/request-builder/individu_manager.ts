import { Entites, INDIVIDU_ID } from '../constants.js'
import { EntityManager } from './entity_manager.js'

/**
 * Manager for Individu (individual) entities in OpenFisca requests
 *
 * Handles individual-specific variables like age, income, status, etc.
 */
export class IndividuManager extends EntityManager {
  private entity: Record<string, VariableValueOnPeriod | VariableToCalculateOnPeriod> = {}

  constructor(individuId: string = INDIVIDU_ID) {
    super(individuId, Entites.Individus)
  }

  /**
   * Add a variable to the individu entity
   *
   * @param variableName - OpenFisca variable name
   * @param value - Variable value (null for questions that need calculation)
   * @param period - Period for the variable
   * @param answerKey - Original answer key (for error tracking)
   */
  addVariable(
    variableName: string,
    value: boolean | number | string | null,
    period: string,
    answerKey: string,
  ): void {
    const existingVariable = this.entity[variableName]

    // For questions (value is null), create variable to calculate
    // OpenFisca will calculate this value
    if (value === null) {
      this.entity[variableName] = { [period]: null }
      return
    }

    if (existingVariable && !Array.isArray(existingVariable)) {
      const existingValue = existingVariable[period]

      if (this.shouldUpdateVariable(variableName, existingValue, value, answerKey)) {
        this.entity[variableName] = { [period]: value } as VariableValueOnPeriod
      }
      else if (existingValue !== undefined && existingValue !== null) {
        this.logVariableConflict(variableName, existingValue, value, answerKey)
        this.addError({
          type: 'MAPPING_ERROR',
          message: `Variable '${variableName}' already exists with different value`,
          answerKey,
        })
      }
      else {
        // Update the existing variable with the new period
        this.entity[variableName] = {
          ...existingVariable,
          [period]: value,
        } as VariableValueOnPeriod
      }
    }
    else {
      // First time setting this variable
      this.entity[variableName] = { [period]: value } as VariableValueOnPeriod
    }
  }

  /**
   * Get the individu entity data structure
   */
  getEntity(): Record<string, VariableValueOnPeriod | VariableToCalculateOnPeriod> {
    return this.entity
  }

  /**
   * Reset the individu entity (useful for testing)
   */
  reset(): void {
    this.entity = {}
    this.errors = []
  }
}
