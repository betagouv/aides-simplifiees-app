import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'aides'

  async up() {
    const hasTypeColumn = await this.schema.hasColumn(this.tableName, 'type')
    if (hasTypeColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('type')
      })
    }

    const hasTypeAideIdColumn = await this.schema.hasColumn(this.tableName, 'type_aide_id')
    if (!hasTypeAideIdColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table
          .integer('type_aide_id')
          .unsigned()
          .nullable()
          .references('id')
          .inTable('type_aides')
          .onDelete('SET NULL')
      })
    }
  }

  async down() {
    // Simplement supprimer la colonne type_aide_id et recréer type comme nullable
    const hasTypeAideIdColumn = await this.schema.hasColumn(this.tableName, 'type_aide_id')
    if (hasTypeAideIdColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('type_aide_id')
      })
    }

    const hasTypeColumn = await this.schema.hasColumn(this.tableName, 'type')
    if (!hasTypeColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.string('type').nullable() // Garder nullable pour éviter les erreurs
      })
    }
  }
}
