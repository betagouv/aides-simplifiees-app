import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'form_submissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Store the simulator ID
      table.string('simulator_id').notNullable().index()

      // Secure hash for public access to results
      table.string('secure_hash', 64).notNullable().unique().index()

      // Store form answers and results as JSON
      table.json('answers').notNullable()
      table.json('results').notNullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
