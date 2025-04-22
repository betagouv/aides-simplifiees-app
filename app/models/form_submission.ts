import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate } from '@adonisjs/lucid/orm'
import crypto from 'node:crypto'

export default class FormSubmission extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare simulatorId: string

  @column()
  declare secureHash: string

  @column({ serialize: (value) => value })
  declare answers: object

  @column({ serialize: (value) => value })
  declare results: object

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Generate a secure random hash before creating the record
   */
  @beforeCreate()
  static generateSecureHash(formSubmission: FormSubmission) {
    // Generate a random string (32 bytes = 64 hex chars)
    const randomBytes = crypto.randomBytes(32).toString('hex')

    // Create a hash that combines simulator ID with random bytes for uniqueness
    formSubmission.secureHash = crypto
      .createHash('sha256')
      .update(`${formSubmission.simulatorId}-${randomBytes}-${Date.now()}`)
      .digest('hex')
      .substring(0, 64) // Limit to 64 characters
  }

  /**
   * Get the URL for viewing the results of this submission
   */
  public getResultsUrl(): string {
    return `/simulateurs/${this.simulatorId}/resultats/${this.secureHash}`
  }
}
