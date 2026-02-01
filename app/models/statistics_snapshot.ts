import type { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type StatisticsSource = 'form_submissions' | 'matomo'

export default class StatisticsSnapshot extends BaseModel {
  static table = 'statistics_snapshots'

  @column({ isPrimary: true })
  declare id: number

  /**
   * The date this snapshot represents (stored in UTC)
   */
  @column()
  declare date: Date

  @column({ columnName: 'simulateur_slug' })
  declare simulateurSlug: string

  /**
   * Source of the data: 'form_submissions' or 'matomo'
   */
  @column()
  declare source: StatisticsSource

  /**
   * Number of form submissions / Submit events
   */
  @column({ columnName: 'submit_count' })
  declare submitCount: number

  /**
   * Number of submissions with at least one eligible aide
   */
  @column({ columnName: 'eligibility_count' })
  declare eligibilityCount: number

  /**
   * Number of Start events (Matomo only, always 0 for form_submissions)
   */
  @column({ columnName: 'start_count' })
  declare startCount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
