import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'simulateurs'

  async up() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'uses_publicodes_forms')
    if (!hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.boolean('uses_publicodes_forms').defaultTo(false).notNullable()
      })
    }
  }

  async down() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'uses_publicodes_forms')
    if (hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('uses_publicodes_forms')
      })
    }
  }
}
