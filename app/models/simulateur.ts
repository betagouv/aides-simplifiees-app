import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Step from './step.js'

export default class Simulateur extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare slug: string

  @column()
  declare title: string

  @column()
  declare description: string

  @column({ columnName: 'short_title' })
  declare shortTitle: string

  @column({ columnName: 'pictogram_path' })
  declare pictogramPath: string

  @column()
  declare status: 'published' | 'draft'

  @column({ columnName: 'built_json' })
  declare builtJson: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Step)
  declare steps: HasMany<typeof Step>
}
