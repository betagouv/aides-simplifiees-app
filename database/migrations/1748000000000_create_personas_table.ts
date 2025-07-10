import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'personas'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.text('description').nullable()
      table.text('test_data').notNullable() // JSON string containing form data
      table
        .integer('simulateur_id')
        .unsigned()
        .references('id')
        .inTable('simulateurs')
        .onDelete('CASCADE')
        .notNullable()
        .index() // Index for faster lookups
      table.enum('status', ['active', 'inactive']).defaultTo('active')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
