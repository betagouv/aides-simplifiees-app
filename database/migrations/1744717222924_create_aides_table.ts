import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'aides'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('title').notNullable()
      table.string('slug').notNullable().unique()
      table.string('type').notNullable()
      table.string('usage').notNullable()
      table.string('instructeur').notNullable()
      table.text('description').notNullable()
      table.json('textes_loi').defaultTo('[]')
      table.text('content').notNullable()


      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}