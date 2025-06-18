import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import Step from './step.js'

export default class Simulateur extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare status: 'published' | 'draft' | 'unlisted'

  @column()
  declare title: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare metaDescription: string | null

  @column({ columnName: 'pictogram_path' })
  declare pictogramPath: string

  @column({ columnName: 'built_json' })
  declare builtJson: string

  @column()
  declare usesPublicodesForms: boolean

  /**
   * The database default specified in migrations (defaultTo('draft'))
   * only applies when inserting directly via SQL, not through the ORM.
   * For testing purposes, we the default in the model.
   */
  @beforeCreate()
  static assignDefaultStatus(simulateur: Simulateur) {
    if (!simulateur.status) {
      simulateur.status = 'draft'
    }
  }

  @hasMany(() => Step)
  declare steps: HasMany<typeof Step>
}
