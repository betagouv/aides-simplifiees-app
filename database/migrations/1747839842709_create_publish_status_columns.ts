import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.table('notions', (table) => {
      table.enum('status', ['published', 'draft']).defaultTo('draft')
    })
    this.schema.table('pages', (table) => {
      table.enum('status', ['published', 'draft']).defaultTo('draft')
    })
    this.schema.table('aides', (table) => {
      table.enum('status', ['published', 'draft']).defaultTo('draft')
    })
  }

  async down() {
    this.schema.table('notions', (table) => {
      table.dropColumn('status')
    })
    this.schema.table('pages', (table) => {
      table.dropColumn('status')
    })
    this.schema.table('aides', (table) => {
      table.dropColumn('status')
    })
  }
}
