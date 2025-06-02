import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'aides'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('type')
    })

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

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('type_aide_id')
    })
    this.schema.alterTable(this.tableName, (table) => {
      table.string('type').notNullable()
    })
  }
}
