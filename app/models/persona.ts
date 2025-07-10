import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import Simulateur from '#models/simulateur'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'

export default class Persona extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column({
    columnName: 'test_data',
    prepare: (value: Record<string, any> | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => {
      if (!value)
        return {}
      try {
        return JSON.parse(value)
      }
      catch {
        return {}
      }
    },
  })
  declare testData: Record<string, any> // JSON object containing the form data

  @column({ columnName: 'simulateur_id' })
  declare simulateurId: number

  @column()
  declare status: 'active' | 'inactive'

  /**
   * Default status for new personas
   */
  @beforeCreate()
  static assignDefaultStatus(persona: Persona) {
    if (!persona.status) {
      persona.status = 'active'
    }
  }

  @belongsTo(() => Simulateur)
  declare simulateur: BelongsTo<typeof Simulateur>
}
