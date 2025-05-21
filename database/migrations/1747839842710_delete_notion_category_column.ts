import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notions'

  async up() {
    // delete the category column
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('category')
    })
  }

  async down() {
    // add the category column
    this.schema.table(this.tableName, (table) => {
      table.string('category').nullable()
    })
  }
}
