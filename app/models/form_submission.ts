import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import crypto from 'node:crypto'
import Simulateur from '#models/simulateur'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'

export default class FormSubmission extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare secureHash: string

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
      .update(`${formSubmission.simulateurSlug}-${randomBytes}-${Date.now()}`)
      .digest('hex')
      .substring(0, 64) // Limit to 64 characters
  }

  @column({ serialize: value => value })
  declare answers: object

  @column({ serialize: value => value })
  declare results: object

  @column({ columnName: 'simulateur_slug' })
  declare simulateurSlug: string

  @belongsTo(() => Simulateur, {
    foreignKey: 'simulateurSlug',
    localKey: 'slug',
  })
  declare simulateur: BelongsTo<typeof Simulateur>

  /**
   * Get the URL for viewing the results of this submission
   */
  public getResultsUrl(): string {
    return `/simulateurs/${this.simulateurSlug}/resultats/${this.secureHash}`
  }
}
