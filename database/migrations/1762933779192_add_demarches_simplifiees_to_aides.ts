import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'aides'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Flag to enable/disable DS integration
      table.boolean('ds_enabled').defaultTo(false).notNullable()

      // Demarches Simplifiees procedure ID
      table.string('ds_demarche_id').nullable()

      // Mapping between DS field keys and survey question IDs (stored as JSON)
      // Format: { "champ_Q2hhbXA...": "question-id", ... }
      table.json('ds_field_mapping').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('ds_enabled')
      table.dropColumn('ds_demarche_id')
      table.dropColumn('ds_field_mapping')
    })
  }
}
