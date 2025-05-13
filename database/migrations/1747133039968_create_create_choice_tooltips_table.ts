import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Add tooltip column to questions table if it doesn't exist
    this.schema.alterTable('questions', (table) => {
      table.text('tooltip').nullable()
    })
  }

  async down() {
    // Remove tooltip column questions choices table
    this.schema.alterTable('questions', (table) => {
      table.dropColumn('tooltip')
    })
  }
}
