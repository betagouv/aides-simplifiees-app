// app/models/aide.ts
import type { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Aide extends BaseModel {
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

  @column({ columnName: 'content' })
  declare content: string | null

  @column()
  declare type: TypeAide | null

  @column()
  declare usage: UsageAide | null

  @column()
  declare instructeur: string | null

  @column({
    columnName: 'textes_loi',
    prepare: value => (typeof value === 'string' ? value : JSON.stringify(value)),
    consume: value => (typeof value === 'string' ? JSON.parse(value) : value),
  })
  declare textesLoi: TexteLoi[]
}
