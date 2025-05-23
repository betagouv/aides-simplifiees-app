import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Choice from './choice.js'
import Step from './step.js'

export default class Question extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare slug: string

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare type: string

  @column({ columnName: 'step_id' })
  declare stepId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Step)
  declare step: BelongsTo<typeof Step>

  @hasMany(() => Choice)
  declare choices: HasMany<typeof Choice>
}
