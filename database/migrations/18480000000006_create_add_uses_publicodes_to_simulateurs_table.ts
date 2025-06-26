import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'simulateurs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('uses_publicodes_forms').defaultTo(false).notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('uses_publicodes_forms')
    })
  }
}
