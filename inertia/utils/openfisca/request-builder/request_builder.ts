import type {
  BuildResult,
  RequestBuilderOptions,
  RequestBuildError,
} from './types.js'
import {
  Entites,
  FAMILLE_ID,
  FOYER_FISCAL_ID,
  INDIVIDU_ID,
  MENAGE_ID,
  UNDEFINED_ENTITY_ID,
} from '../constants.js'
import { datePeriods, getCurrentPeriod } from '../date_periods.js'
import { FamilleManager } from './famille_manager.js'
import { FoyerFiscalManager } from './foyer_fiscal_manager.js'
import { IndividuManager } from './individu_manager.js'
import { MappingResolver } from './mapping_resolver.js'
import { MenageManager } from './menage_manager.js'

/**
 * Builder for OpenFisca calculation requests
 *
 * Provides a fluent API to construct OpenFisca API requests from survey answers.
 * Handles mapping resolution, entity management, and error collection.
 *
 * @example
 * const builder = new OpenFiscaRequestBuilder()
 * const result = builder
 *   .addAnswer('age', 25)
 *   .addAnswer('salaire_net', 1500)
 *   .build()
 *
 * if (result.errors.length > 0) {
 *   console.error('Build errors:', result.errors)
 * }
 */
export class OpenFiscaRequestBuilder {
  private request: OpenFiscaCalculationRequest
  private errors: RequestBuildError[] = []
  private readonly resolver: MappingResolver
  private readonly options: RequestBuilderOptions

  // Entity managers
  private readonly individuManager: IndividuManager
  private readonly menageManager: MenageManager
  private readonly foyerFiscalManager: FoyerFiscalManager
  private readonly familleManager: FamilleManager

  constructor(options: RequestBuilderOptions = {}) {
    this.options = options
    this.resolver = new MappingResolver()

    // Initialize entity managers
    this.individuManager = new IndividuManager(INDIVIDU_ID)
    this.menageManager = new MenageManager(MENAGE_ID, INDIVIDU_ID)
    this.foyerFiscalManager = new FoyerFiscalManager(FOYER_FISCAL_ID, INDIVIDU_ID)
    this.familleManager = new FamilleManager(FAMILLE_ID, INDIVIDU_ID)

    this.request = this.initRequest()
  }

  /**
   * Initialize an empty OpenFisca request structure
   */
  private initRequest(): OpenFiscaCalculationRequest {
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
   * Add a single answer to the request
   *
   * @param answerKey - Survey answer key
   * @param answerValue - Answer value
   * @returns This builder instance for chaining
   */
  addAnswer(answerKey: string, answerValue: SurveyAnswerValue): this {
    // Skip undefined/null values
    if (answerValue === undefined || answerValue === null) {
      if (this.options.allowUndefinedValues !== false) {
        return this
      }
      this.addError({
        type: 'UNDEFINED_VALUE',
        message: `Undefined value for answer key: ${answerKey}`,
        answerKey,
      })
      return this
    }

    // Handle ComboboxAnswer type - extract the value
    if (typeof answerValue === 'object' && !Array.isArray(answerValue) && 'value' in answerValue) {
      answerValue = answerValue.value
    }

    // Validate answer value type (must be primitive after extraction)
    if (
      typeof answerValue !== 'boolean'
      && typeof answerValue !== 'number'
      && typeof answerValue !== 'string'
    ) {
      this.addError({
        type: 'UNEXPECTED_VALUE',
        message: `Unexpected value type for answer key: ${answerKey}`,
        answerKey,
      })
      return this
    }

    // Resolve mapping
    const mapping = this.resolver.resolve(answerKey)
    if (!mapping) {
      this.addError({
        type: 'UNKNOWN_VARIABLE',
        message: `No mapping found for answer key: ${answerKey}`,
        answerKey,
      })
      return this
    }

    // Skip excluded mappings
    if ('exclude' in mapping && mapping.exclude === true) {
      return this
    }

    // Type guard: at this point mapping is OpenFiscaMapping
    const openfiscaMapping = mapping as OpenFiscaMapping

    // Resolve entity
    const entityId = this.resolver.resolveEntity(answerKey)
    if (entityId === UNDEFINED_ENTITY_ID) {
      this.addError({
        type: 'UNKNOWN_ENTITY',
        message: `No entity found for answer key: ${answerKey}`,
        answerKey,
      })
      return this
    }

    // Process mapping and add to entity manager
    this.processMapping(answerKey, answerValue, openfiscaMapping, entityId)

    return this
  }

  /**
   * Process a mapping and add it to the appropriate entity manager
   *
   * @param answerKey - Survey answer key
   * @param answerValue - Answer value (primitive type)
   * @param mapping - OpenFisca mapping
   * @param entityId - Entity ID (usager, menage_usager, etc.)
   */
  private processMapping(
    answerKey: string,
    answerValue: boolean | number | string,
    mapping: OpenFiscaMapping,
    entityId: string,
  ): void {
    let variablesToAdd: Record<string, VariableValueOnPeriod>

    // Handle dispatch mapping
    if ('dispatch' in mapping) {
      variablesToAdd = mapping.dispatch(answerKey, answerValue, mapping.period)
    }
    // Handle direct mapping
    else if ('openfiscaVariableName' in mapping) {
      const period = getCurrentPeriod(mapping.period)
      variablesToAdd = {
        [mapping.openfiscaVariableName]: {
          [period]: answerValue,
        },
      }
    }
    else {
      this.addError({
        type: 'MAPPING_ERROR',
        message: `Invalid mapping for answer key: ${answerKey}`,
        answerKey,
      })
      return
    }

    // Add variables to the appropriate entity manager
    const manager = this.getEntityManager(entityId)
    if (!manager) {
      this.addError({
        type: 'UNKNOWN_ENTITY',
        message: `No entity manager found for entity ID: ${entityId}`,
        answerKey,
      })
      return
    }

    // Add each variable to the entity manager
    for (const [variableName, variableValue] of Object.entries(variablesToAdd)) {
      const period = Object.keys(variableValue)[0]
      const value = variableValue[period]

      if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
        manager.addVariable(variableName, value, period, answerKey)
      }
    }
  }

  /**
   * Get the appropriate entity manager for an entity ID
   *
   * @param entityId - Entity ID
   * @returns Entity manager or null if not found
   */
  private getEntityManager(entityId: string): IndividuManager | MenageManager | FoyerFiscalManager | FamilleManager | null {
    switch (entityId) {
      case INDIVIDU_ID:
        return this.individuManager
      case MENAGE_ID:
        return this.menageManager
      case FOYER_FISCAL_ID:
        return this.foyerFiscalManager
      case FAMILLE_ID:
        return this.familleManager
      default:
        return null
    }
  }

  /**
   * Add multiple answers to the request
   *
   * @param answers - Record of answer key-value pairs
   * @returns This builder instance for chaining
   */
  addAnswers(answers: Record<string, SurveyAnswerValue>): this {
    for (const [key, value] of Object.entries(answers)) {
      this.addAnswer(key, value)
    }
    return this
  }

  /**
   * Add a question to the request for calculation
   *
   * Questions are special OpenFisca variables that should be calculated
   * (e.g., 'apl', 'aide_mobilite_master'). They don't have answer values
   * but need to be added to the request with empty period objects to
   * trigger OpenFisca calculation.
   *
   * @param questionKey - Question key (e.g., 'aide-personnalisee-logement')
   * @returns This builder instance for chaining
   */
  addQuestion(questionKey: string): this {
    // Resolve mapping
    const mapping = this.resolver.resolve(questionKey)
    if (!mapping) {
      this.addError({
        type: 'UNKNOWN_VARIABLE',
        message: `No mapping found for question key: ${questionKey}`,
        answerKey: questionKey,
      })
      return this
    }

    // Only direct mappings are supported for questions
    if (!('openfiscaVariableName' in mapping)) {
      this.addError({
        type: 'MAPPING_ERROR',
        message: `Question key must have direct mapping: ${questionKey}`,
        answerKey: questionKey,
      })
      return this
    }

    // Resolve entity
    const entityId = this.resolver.resolveEntity(questionKey)
    if (entityId === UNDEFINED_ENTITY_ID) {
      this.addError({
        type: 'UNKNOWN_ENTITY',
        message: `No entity found for question key: ${questionKey}`,
        answerKey: questionKey,
      })
      return this
    }

    // Get the entity manager
    const manager = this.getEntityManager(entityId)
    if (!manager) {
      this.addError({
        type: 'UNKNOWN_ENTITY',
        message: `No entity manager found for entity ID: ${entityId}`,
        answerKey: questionKey,
      })
      return this
    }

    // Add question to entity (using null as value to indicate it's a question)
    const period = getCurrentPeriod(mapping.period)
    manager.addVariable(mapping.openfiscaVariableName, null, period, questionKey)

    return this
  }

  /**
   * Add multiple questions to the request
   *
   * @param questions - Array of question keys
   * @returns This builder instance for chaining
   */
  addQuestions(questions: string[]): this {
    for (const questionKey of questions) {
      this.addQuestion(questionKey)
    }
    return this
  }

  /**
   * Add a build error
   *
   * @param error - Build error to add
   */
  private addError(error: RequestBuildError): void {
    this.errors.push(error)

    if (this.options.throwOnError) {
      throw new Error(`${error.type}: ${error.message}`)
    }
  }

  /**
   * Apply default values and business rules to the request
   *
   * This method applies OpenFisca-specific business rules:
   * - Sets default nationality to FR (France)
   * - Sets default housing entry date to next month
   * - Adjusts academic year based on student mobility choices
   *
   * Should be called before build() if these defaults are needed.
   *
   * @returns This builder instance for chaining
   */
  applyDefaultValues(): this {
    const period = getCurrentPeriod('MONTH')

    // Default nationality to France
    if (!this.individuManager.getEntity().nationalite) {
      this.individuManager.addVariable('nationalite', 'FR', period, 'default_nationalite')
    }

    // Default housing entry date to next month
    if (!this.menageManager.getEntity().date_entree_logement) {
      this.menageManager.addVariable('date_entree_logement', datePeriods.MONTH_NEXT, period, 'default_date_entree_logement')
    }

    // Academic year adjustment based on student mobility
    const individuEntity = this.individuManager.getEntity()
    
    // If sortie_academie is true (Parcoursup nouvelle région)
    if (individuEntity.sortie_academie) {
      const sortieAcademieValue = individuEntity.sortie_academie[period]
      if (sortieAcademieValue === true) {
        this.individuManager.addVariable('annee_etude', 'terminale', period, 'mobility_annee_etude')
      }
    }

    // If sortie_region_academique is true (Master nouvelle zone)
    if (individuEntity.sortie_region_academique) {
      const sortieRegionValue = individuEntity.sortie_region_academique[period]
      if (sortieRegionValue === true) {
        // Could be either 'master_1' or 'licence_3'
        this.individuManager.addVariable('annee_etude', 'master_1', period, 'mobility_annee_etude')
      }
    }

    return this
  }

  /**
   * Build and validate the request
   *
   * @returns Build result with request and errors
   */
  build(): BuildResult {
    // Collect errors from entity managers
    this.collectEntityErrors()

    // Populate request with entity data from managers
    this.request[Entites.Individus][INDIVIDU_ID] = this.individuManager.getEntity()
    this.request[Entites.Menages][MENAGE_ID] = this.menageManager.getEntity()
    this.request[Entites.FoyersFiscaux][FOYER_FISCAL_ID] = this.foyerFiscalManager.getEntity()
    this.request[Entites.Familles][FAMILLE_ID] = this.familleManager.getEntity()

    // TODO: Add validation logic
    // - Check for required variables
    // - Validate entity relationships
    // - Check for conflicting values

    if (this.errors.length > 0) {
      return {
        success: false,
        errors: this.errors,
      }
    }

    return {
      success: true,
      request: this.request,
    }
  }

  /**
   * Collect errors from all entity managers
   */
  private collectEntityErrors(): void {
    const managers = [
      this.individuManager,
      this.menageManager,
      this.foyerFiscalManager,
      this.familleManager,
    ]

    for (const manager of managers) {
      if (manager.hasErrors()) {
        this.errors.push(...manager.getErrors())
      }
    }
  }

  /**
   * Get current build errors
   *
   * @returns Array of build errors
   */
  getErrors(): readonly RequestBuildError[] {
    return [...this.errors]
  }

  /**
   * Check if there are any build errors
   *
   * @returns True if there are errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = []
  }

  /**
   * Get the current request (useful for debugging)
   *
   * @returns Current request state
   */
  getRequest(): OpenFiscaCalculationRequest {
    return this.request
  }
}
