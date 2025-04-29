// app/models/aide.ts
import type { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Aide extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare slug: string

  @column()
  declare type: TypeAide

  @column()
  declare usage: UsageAide

  @column()
  declare instructeur: string

  @column()
  declare description: string

  @column({
    columnName: 'textes_loi',
    prepare: value => (typeof value === 'string' ? value : JSON.stringify(value)),
    consume: value => (typeof value === 'string' ? JSON.parse(value) : value),
  })
  declare textesLoi: TexteLoi[]

  @column({ columnName: 'content' })
  declare content: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
