/**
 * Schema validator using Ajv (Another JSON Schema Validator)
 * Validates survey schemas against the JSON Schema definition
 */

import Ajv, { type ErrorObject } from 'ajv'
import addFormats from 'ajv-formats'
import type { SurveySchema } from '../types/schema.js'
import schemaV2 from './schemas/v2.0.0.schema.json'

/**
 * Validation error with detailed context
 */
export interface SchemaValidationError {
  /** JSON path to the error location */
  path: string
  /** Error message */
  message: string
  /** Error keyword from JSON Schema */
  keyword: string
  /** Additional error parameters */
  params?: Record<string, any>
  /** The schema that failed validation */
  schema?: any
  /** The data that failed validation */
  data?: any
}

/**
 * Result of schema validation
 */
export interface SchemaValidationResult {
  /** Whether the schema is valid */
  valid: boolean
  /** Validation errors if any */
  errors?: SchemaValidationError[]
  /** Raw Ajv errors */
  rawErrors?: ErrorObject[]
}

/**
 * Options for schema validator
 */
export interface SchemaValidatorOptions {
  /**
   * Schema version to validate against
   * Default: '2.0.0'
   */
  schemaVersion?: string
  /**
   * If true, remove additional properties not defined in schema
   * Default: false
   */
  removeAdditional?: boolean
  /**
   * If true, coerce types (e.g., string to number)
   * Default: false
   */
  coerceTypes?: boolean
  /**
   * If true, use defaults from schema
   * Default: true
   */
  useDefaults?: boolean
}

/**
 * Validates survey schemas against JSON Schema definitions
 *
 * @example
 * ```typescript
 * const validator = new SchemaValidator('2.0.0')
 * const result = validator.validate(mySchema)
 * if (!result.valid) {
 *   console.error('Schema validation failed:', result.errors)
 * }
 * ```
 */
export class SchemaValidator {
  private readonly ajv: Ajv
  private readonly schemaVersion: string
  private readonly validateFunction: any

  constructor(options: SchemaValidatorOptions = {}) {
    this.schemaVersion = options.schemaVersion || '2.0.0'

    // Initialize Ajv with options
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      removeAdditional: options.removeAdditional || false,
      coerceTypes: options.coerceTypes || false,
      useDefaults: options.useDefaults !== false,
      strict: false, // Allow additional JSON Schema features
    })

    // Add format validators (email, date, etc.)
    addFormats(this.ajv)

    // Load the appropriate schema version
    const schemaDefinition = this.loadSchemaDefinition(this.schemaVersion)
    this.validateFunction = this.ajv.compile(schemaDefinition)
  }

  /**
   * Validate a survey schema
   *
   * @param schema - The schema to validate
   * @returns Validation result with errors if any
   */
  validate(schema: unknown): SchemaValidationResult {
    const valid = this.validateFunction(schema)

    if (valid) {
      return { valid: true }
    }

    const errors = this.formatErrors(this.validateFunction.errors || [])

    return {
      valid: false,
      errors,
      rawErrors: this.validateFunction.errors,
    }
  }

  /**
   * Validate a schema and throw an error if invalid
   *
   * @param schema - The schema to validate
   * @throws Error if schema is invalid
   */
  validateOrThrow(schema: unknown): asserts schema is SurveySchema {
    const result = this.validate(schema)
    if (!result.valid) {
      const errorMessages = result.errors?.map((e) => `${e.path}: ${e.message}`).join('\n')
      throw new Error(`Schema validation failed:\n${errorMessages}`)
    }
  }

  /**
   * Validate a schema from a JSON string
   *
   * @param jsonString - JSON string to parse and validate
   * @returns Validation result
   */
  validateJson(jsonString: string): SchemaValidationResult {
    try {
      const schema = JSON.parse(jsonString)
      return this.validate(schema)
    } catch (error) {
      return {
        valid: false,
        errors: [
          {
            path: '',
            message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
            keyword: 'parse',
          },
        ],
      }
    }
  }

  /**
   * Validate a schema from a file
   * Note: This is async and requires a file system implementation
   *
   * @param filePath - Path to the schema file
   * @returns Validation result
   */
  async validateFile(filePath: string): Promise<SchemaValidationResult> {
    try {
      // Dynamic import to avoid bundling Node.js modules in browser builds
      const fs = await import('node:fs/promises')
      const content = await fs.readFile(filePath, 'utf-8')
      return this.validateJson(content)
    } catch (error) {
      return {
        valid: false,
        errors: [
          {
            path: '',
            message: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
            keyword: 'file',
          },
        ],
      }
    }
  }

  /**
   * Get the current schema version
   */
  getSchemaVersion(): string {
    return this.schemaVersion
  }

  /**
   * Get the compiled schema definition
   */
  getSchemaDefinition(): any {
    return this.validateFunction.schema
  }

  /**
   * Load the schema definition for a specific version
   */
  private loadSchemaDefinition(version: string): any {
    switch (version) {
      case '2.0.0':
        return schemaV2
      default:
        throw new Error(`Unsupported schema version: ${version}`)
    }
  }

  /**
   * Format Ajv errors into a more user-friendly format
   */
  private formatErrors(ajvErrors: ErrorObject[]): SchemaValidationError[] {
    return ajvErrors.map((error) => ({
      path: error.instancePath || '/',
      message: error.message || 'Validation error',
      keyword: error.keyword,
      params: error.params,
      schema: error.schema,
      data: error.data,
    }))
  }

  /**
   * Get a human-readable summary of validation errors
   */
  getErrorSummary(result: SchemaValidationResult): string {
    if (result.valid) {
      return 'Schema is valid'
    }

    const errorCount = result.errors?.length || 0
    const summary = [`Schema validation failed with ${errorCount} error(s):\n`]

    result.errors?.forEach((error, index) => {
      summary.push(`${index + 1}. ${error.path || 'root'}: ${error.message}`)
    })

    return summary.join('\n')
  }
}
